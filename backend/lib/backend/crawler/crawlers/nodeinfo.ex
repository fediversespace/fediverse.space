defmodule Backend.Crawler.Crawlers.Nodeinfo do
  @moduledoc """
  This module is slightly different from the other crawlers. It's run before all the others and its
  result is included in theirs.
  """

  alias Backend.Crawler.ApiCrawler
  require Logger
  import Backend.Util
  import Backend.Crawler.Util
  @behaviour ApiCrawler

  @impl ApiCrawler
  def allows_crawling?(domain) do
    [
      ".well-known/nodeinfo"
    ]
    |> Enum.map(fn endpoint -> "https://#{domain}#{endpoint}" end)
    |> urls_are_crawlable?()
  end

  @impl ApiCrawler
  def is_instance_type?(_domain, _nodeinfo) do
    # This crawler is used slightly differently from the others -- we always check for nodeinfo.
    true
  end

  @impl ApiCrawler
  def crawl(domain, _curr_result) do
    with {:ok, nodeinfo_url} <- get_nodeinfo_url(domain),
         {:ok, nodeinfo} <- get_nodeinfo(nodeinfo_url) do
      nodeinfo
    else
      _other -> ApiCrawler.get_default()
    end
  end

  @spec get_nodeinfo_url(String.t()) ::
          {:ok, String.t()} | {:error, Jason.DecodeError.t() | HTTPoison.Error.t()}
  defp get_nodeinfo_url(domain) do
    case get_and_decode("https://#{domain}/.well-known/nodeinfo") do
      {:ok, response} -> {:ok, process_nodeinfo_url(response)}
      {:error, err} -> {:error, err}
    end
  end

  @spec process_nodeinfo_url(any()) :: String.t()
  defp process_nodeinfo_url(response) do
    response
    |> Map.get("links")
    |> Enum.filter(fn %{"rel" => rel} -> is_compatible_nodeinfo_version?(rel) end)
    |> Kernel.hd()
    |> Map.get("href")
  end

  @spec get_nodeinfo(String.t()) :: ApiCrawler.t()
  defp get_nodeinfo(nodeinfo_url) do
    case get_and_decode(nodeinfo_url) do
      {:ok, nodeinfo} -> {:ok, process_nodeinfo(nodeinfo)}
      {:error, err} -> {:error, err}
    end
  end

  @spec process_nodeinfo(any()) :: ApiCrawler.t()
  defp process_nodeinfo(nodeinfo) do
    user_count = get_in(nodeinfo, ["usage", "users", "total"])

    if is_above_user_threshold?(user_count) do
      # Both of these are used, depending on the server implementation
      description =
        [
          get_in(nodeinfo, ["metadata", "description"]),
          get_in(nodeinfo, ["metadata", "nodeDescription"])
        ]
        |> Enum.filter(fn d -> d != nil end)
        |> Enum.at(0)

      type = nodeinfo |> get_in(["software", "name"]) |> String.downcase() |> String.to_atom()

      Map.merge(
        ApiCrawler.get_default(),
        %{
          description: description,
          user_count: user_count,
          status_count: get_in(nodeinfo, ["usage", "localPosts"]),
          instance_type: type,
          version: get_in(nodeinfo, ["software", "version"]),
          federation_restrictions: get_federation_restrictions(nodeinfo)
        }
      )
    else
      Map.merge(
        ApiCrawler.get_default(),
        %{
          user_count: user_count
        }
      )
    end
  end

  @spec is_compatible_nodeinfo_version?(String.t()) :: boolean()
  defp is_compatible_nodeinfo_version?(schema_url) do
    version = String.slice(schema_url, (String.length(schema_url) - 3)..-1)
    Enum.member?(["1.0", "1.1", "2.0"], version)
  end

  @spec get_federation_restrictions(any()) :: [ApiCrawler.federation_restriction()]
  defp get_federation_restrictions(nodeinfo) do
    mrf_simple = get_in(nodeinfo, ["metadata", "federation", "mrf_simple"])
    quarantined_domains = get_in(nodeinfo, ["metadata", "federation", "quarantined_instances"])

    quarantined_domains =
      if quarantined_domains == nil do
        []
      else
        Enum.map(quarantined_domains, fn domain -> {domain, "quarantine"} end)
      end

    if mrf_simple != nil do
      mrf_simple
      |> Map.take([
        "report_removal",
        "reject",
        "media_removal",
        "media_nsfw",
        "federated_timeline_removal",
        "banner_removal",
        "avatar_removal",
        "accept"
      ])
      |> Enum.flat_map(fn {type, domains} ->
        Enum.map(domains, fn domain -> {domain, type} end)
      end)
      |> Enum.concat(quarantined_domains)
    else
      quarantined_domains
    end
  end
end
