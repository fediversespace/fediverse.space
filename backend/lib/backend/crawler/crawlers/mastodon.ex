defmodule Backend.Crawler.Crawlers.Mastodon do
  require Logger
  import Backend.Crawler.Util
  import Backend.Util
  alias Backend.Crawler.ApiCrawler

  @behaviour ApiCrawler

  @impl ApiCrawler
  def is_instance_type?(domain) do
    case get("https://#{domain}/api/v1/instance") do
      {:ok, response} -> if is_http_200?(response), do: has_title?(response.body), else: false
      {:error, _error} -> false
    end
  end

  @impl ApiCrawler
  def allows_crawling?(domain) do
    endpoints = [
      "/api/v1/instance",
      "/api/v1/instance/peers",
      "/api/v1/timelines/public"
    ]

    user_agent = get_config(:user_agent)

    endpoints
    |> Enum.map(fn endpoint -> "https://#{domain}#{endpoint}" end)
    |> Enum.all?(fn endpoint -> Gollum.crawlable?(user_agent, endpoint) != :uncrawlable end)
  end

  @impl ApiCrawler
  # sobelow_skip ["DOS.StringToAtom"]
  def crawl(domain) do
    instance = Jason.decode!(get!("https://#{domain}/api/v1/instance").body)

    if get_in(instance, ["stats", "user_count"]) > get_config(:personal_instance_threshold) do
      crawl_large_instance(domain, instance)
    else
      Map.merge(
        Map.take(instance["stats"], ["user_count"])
        |> Map.new(fn {k, v} -> {String.to_atom(k), v} end),
        %{
          peers: [],
          interactions: %{},
          statuses_seen: 0,
          instance_type: nil,
          description: nil,
          version: nil,
          status_count: nil
        }
      )
    end
  end

  @spec crawl_large_instance(String.t(), any()) :: ApiCrawler.t()
  # sobelow_skip ["DOS.StringToAtom"]
  defp crawl_large_instance(domain, instance) do
    # servers may not publish peers
    peers =
      case get("https://#{domain}/api/v1/instance/peers") do
        {:ok, response} -> if is_http_200?(response), do: Jason.decode!(response.body), else: []
        {:error, _error} -> []
      end

    Logger.debug("Found #{length(peers)} peers.")

    {interactions, statuses_seen} = get_interactions(domain)

    Logger.debug(
      "#{domain}: found #{
        interactions |> Map.values() |> Enum.reduce(0, fn count, acc -> count + acc end)
      } mentions in #{statuses_seen} statuses."
    )

    instance_type =
      cond do
        Map.get(instance, "version") |> String.downcase() =~ "pleroma" -> :pleroma
        is_gab?(instance) -> :gab
        true -> :mastodon
      end

    Map.merge(
      Map.merge(
        Map.take(instance, ["version", "description"]),
        Map.take(instance["stats"], ["user_count", "status_count"])
      )
      |> Map.new(fn {k, v} -> {String.to_atom(k), v} end),
      %{
        peers: peers,
        interactions: interactions,
        statuses_seen: statuses_seen,
        instance_type: instance_type
      }
    )
  end

  @spec get_interactions(
          String.t(),
          String.t() | nil,
          Calendar.naive_datetime() | nil,
          ApiCrawler.instance_interactions(),
          integer
        ) :: {ApiCrawler.instance_interactions(), integer}
  defp get_interactions(
         domain,
         max_id \\ nil,
         min_timestamp \\ nil,
         interactions \\ %{},
         statuses_seen \\ 0
       ) do
    # If `statuses_seen == 0`, it's the first call of this function, which means we want to query the database for the
    # most recent status we have.
    min_timestamp =
      if statuses_seen == 0 do
        get_last_successful_crawl_timestamp(domain)
      else
        min_timestamp
      end

    endpoint = "https://#{domain}/api/v1/timelines/public?local=true"

    endpoint =
      if max_id do
        endpoint <> "&max_id=#{max_id}"
      else
        endpoint
      end

    Logger.debug("Crawling #{endpoint}")

    statuses =
      endpoint
      |> get!()
      |> Map.get(:body)
      |> Jason.decode!()

    filtered_statuses =
      statuses
      |> Enum.filter(fn s -> is_after?(s["created_at"], min_timestamp) end)

    if length(filtered_statuses) > 0 do
      # get statuses that are eligible (i.e. users don't have #nobot in their profile) and have mentions
      interactions = Map.merge(interactions, statuses_to_interactions(filtered_statuses))
      statuses_seen = statuses_seen + length(filtered_statuses)

      status_datetime_threshold =
        NaiveDateTime.utc_now()
        |> NaiveDateTime.add(get_config(:status_age_limit_days) * 24 * 3600 * -1, :second)

      oldest_status = Enum.at(filtered_statuses, -1)

      oldest_status_datetime =
        oldest_status
        |> (fn s -> s["created_at"] end).()
        |> NaiveDateTime.from_iso8601!()

      if NaiveDateTime.compare(oldest_status_datetime, status_datetime_threshold) == :gt and
           statuses_seen < get_config(:status_count_limit) and
           length(filtered_statuses) == length(statuses) do
        get_interactions(domain, oldest_status["id"], min_timestamp, interactions, statuses_seen)
      else
        {interactions, statuses_seen}
      end
    else
      {interactions, statuses_seen}
    end
  end

  # To check if the endpoint works as expected
  @spec has_title?(String.t()) :: boolean
  defp has_title?(body) do
    case Jason.decode(body) do
      {:ok, decoded} -> Map.has_key?(decoded, "title")
      {:error, _error} -> false
    end
  end

  # Checks whether the status contains one or more mentions
  defp is_mention?(status) do
    case status["mentions"] do
      [] -> false
      nil -> false
      _ -> true
    end
  end

  # Checks if the author of the status has "nobot" in their profile
  defp has_nobot?(status) do
    account = status["account"]

    fields =
      account["fields"]
      |> Enum.map(fn %{"name" => name, "value" => value} -> name <> value end)
      |> Enum.join("")

    # this also means that any users who mentioned ethnobotany in their profiles will be excluded lol ¯\_(ツ)_/¯
    (account["note"] <> fields)
    |> String.downcase()
    |> String.contains?("nobot")
  end

  # This checks if the status
  # a) contains one or more mentions, and
  # b) that the person posting doesn't have "nobot" in their profile
  defp is_eligible?(status) do
    is_mention?(status) and not has_nobot?(status)
  end

  @spec extract_mentions_from_status(any()) :: ApiCrawler.instance_interactions()
  defp extract_mentions_from_status(status) do
    status["mentions"]
    |> Enum.map(fn mention -> get_domain(mention["url"]) end)
    |> Enum.reduce(%{}, fn domain, acc ->
      Map.update(acc, domain, 1, &(&1 + 1))
    end)
  end

  @spec statuses_to_interactions(any()) :: ApiCrawler.instance_interactions()
  defp statuses_to_interactions(statuses) do
    statuses
    |> Enum.filter(fn status -> is_eligible?(status) end)
    |> Enum.map(fn status -> extract_mentions_from_status(status) end)
    |> Enum.reduce(%{}, fn map, acc ->
      Map.merge(acc, map)
    end)
  end

  defp is_gab?(instance) do
    title_is_gab = Map.get(instance, "title") |> String.downcase() == "gab social"

    contact_account = Map.get(instance, "contact_account")

    if contact_account != nil do
      gab_keys = ["is_pro", "is_verified", "is_donor", "is_investor"]
      has_gab_keys = gab_keys |> Enum.any?(&Map.has_key?(contact_account, &1))
      title_is_gab or has_gab_keys
    else
      title_is_gab
    end
  end
end
