defmodule Backend.Crawler.Crawlers.GnuSocial do
  alias Backend.Crawler.ApiCrawler
  alias Backend.Crawler.Crawlers.Nodeinfo
  import Backend.Crawler.Util
  import Backend.Util
  require Logger

  @behaviour ApiCrawler

  @impl ApiCrawler
  def is_instance_type?(domain, nodeinfo_result) do
    if nodeinfo_result != nil do
      Map.get(nodeinfo_result, :instance_type) == :gnusocial
    else
      case get_and_decode("https://#{domain}/api/statuses/public_timeline.json") do
        {:ok, statuses} -> is_list(statuses)
        {:error, _other} -> false
      end
    end
  end

  @impl ApiCrawler
  def allows_crawling?(domain) do
    [
      "/api/statuses/public_timeline.json"
    ]
    |> Enum.map(fn endpoint -> "https://#{domain}#{endpoint}" end)
    |> urls_are_crawlable?()
  end

  @impl ApiCrawler
  def crawl(domain, nodeinfo_result) do
    if nodeinfo_result == nil or
         nodeinfo_result |> Map.get(:user_count) |> is_above_user_threshold?() do
      crawl_large_instance(domain, nodeinfo_result)
    else
      nodeinfo_result
    end
  end

  @spec crawl_large_instance(String.t(), Nodeinfo.t()) :: ApiCrawler.t()
  defp crawl_large_instance(domain, nodeinfo_result) do
    status_datetime_threshold =
      NaiveDateTime.utc_now()
      |> NaiveDateTime.add(get_config(:status_age_limit_days) * 24 * 3600 * -1, :second)

    # Don't get any statuses older than this
    min_timestamp = max_datetime(get_last_crawl_timestamp(domain), status_datetime_threshold)

    {interactions, statuses_seen} = get_interactions(domain, min_timestamp)

    if nodeinfo_result != nil do
      Map.merge(nodeinfo_result, %{
        interactions: interactions,
        statuses_seen: statuses_seen,
        peers: []
      })
    else
      %{
        version: nil,
        description: nil,
        user_count: nil,
        status_count: nil,
        peers: [],
        interactions: interactions,
        statuses_seen: statuses_seen,
        instance_type: :gnusocial
      }
    end
  end

  @spec get_interactions(
          String.t(),
          NaiveDateTime.t(),
          String.t() | nil,
          ApiCrawler.instance_interactions(),
          integer()
        ) :: {ApiCrawler.instance_interactions(), integer()}
  defp get_interactions(
         domain,
         min_timestamp,
         max_id \\ nil,
         interactions \\ %{},
         statuses_seen \\ 0
       ) do
    endpoint = "https://#{domain}/api/statuses/public_timeline.json"

    endpoint =
      if max_id != nil do
        endpoint <> "?max_id=#{max_id}"
      else
        endpoint
      end

    Logger.debug("Crawling #{endpoint}")

    statuses = get_and_decode!(endpoint)

    # Filter to statuses that are in the correct timeframe
    filtered_statuses =
      statuses
      |> Enum.filter(fn s ->
        s["created_at"]
        |> parse_timestamp()
        |> is_after?(min_timestamp)
      end)

    if length(filtered_statuses) > 0 do
      # Filter down further to statuses that a) aren't faves and b) aren't from #nobot users
      eligible_statuses =
        filtered_statuses |> Enum.filter(fn s -> not is_fave?(s) and not has_nobot?(s) end)

      # get statuses that are eligible (i.e. users don't have #nobot in their profile), have mentions, and are not faves
      interactions =
        eligible_statuses
        |> statuses_to_interactions()
        |> merge_count_maps(interactions)

      statuses_seen =
        eligible_statuses
        |> Kernel.length()
        |> Kernel.+(statuses_seen)

      oldest_status = Enum.at(filtered_statuses, -1)

      oldest_status_datetime =
        oldest_status
        |> Map.get("created_at")
        |> parse_timestamp()

      if NaiveDateTime.compare(oldest_status_datetime, min_timestamp) == :gt and
           statuses_seen < get_config(:status_count_limit) and
           length(filtered_statuses) == length(statuses) do
        get_interactions(domain, min_timestamp, oldest_status["id"], interactions, statuses_seen)
      else
        {interactions, statuses_seen}
      end
    else
      {interactions, statuses_seen}
    end
  end

  @spec statuses_to_interactions(any()) :: ApiCrawler.instance_interactions()
  defp statuses_to_interactions(statuses) do
    statuses
    |> Enum.filter(fn status -> is_mention?(status) end)
    |> Enum.map(fn status -> extract_mentions_from_status(status) end)
    |> Enum.reduce(%{}, fn map, acc ->
      Map.merge(acc, map)
    end)
  end

  # Checks whether the status contains one or more mentions
  @spec is_mention?(any()) :: boolean()
  defp is_mention?(%{"attentions" => []}) do
    false
  end

  defp is_mention?(_status) do
    true
  end

  @spec is_fave?(any()) :: boolean()
  defp is_fave?(status) do
    uri_elements = status |> Map.get("uri") |> String.split(":")
    Enum.member?(uri_elements, "fave")
  end

  @spec has_nobot?(any()) :: boolean()
  defp has_nobot?(status) do
    case get_in(status, ["user", "description"]) do
      nil ->
        false

      description ->
        description
        |> String.downcase()
        |> String.contains?("nobot")
    end
  end

  @spec extract_mentions_from_status(any()) :: ApiCrawler.instance_interactions()
  defp extract_mentions_from_status(status) do
    status["attentions"]
    |> Enum.map(fn mention -> get_domain(mention["profileurl"]) end)
    |> Enum.reduce(%{}, fn domain, acc ->
      Map.update(acc, domain, 1, &(&1 + 1))
    end)
  end

  # Parses the messed-up time format that GNU social uses
  # Like seriously, it's 2019, why *wouldn't* you use iso8601?
  @spec parse_timestamp(String.t()) :: NaiveDateTime.t()
  defp parse_timestamp(timestamp) do
    timestamp
    |> Timex.parse!("{WDshort} {Mshort} {0D} {h24}:{0m}:{0s} {0Z} {YYYY}")
    |> Timex.to_naive_datetime()
  end
end
