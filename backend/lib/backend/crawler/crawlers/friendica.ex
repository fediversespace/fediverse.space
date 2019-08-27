defmodule Backend.Crawler.Crawlers.Friendica do
  @moduledoc """
  A crawler for Friendica servers.
  These don't expose a public list of statuses. This crawler combines nodeinfo data with the /statistics.json endpoint
  in Friendica, and gets a list of peers from /poco/@server.
  """
  alias Backend.Crawler.ApiCrawler
  import Backend.Crawler.Util
  import Backend.Util
  require Logger

  @behaviour ApiCrawler

  @impl ApiCrawler
  def is_instance_type?(domain, nodeinfo_result) do
    if nodeinfo_result != nil do
      Map.get(nodeinfo_result, :instance_type) == :friendica
    else
      case get_statistics(domain) do
        {:ok, stats} -> Map.get(stats, "network") |> String.downcase() == "friendica"
        {:error, _other} -> false
      end
    end
  end

  @impl ApiCrawler
  def allows_crawling?(domain) do
    [
      "/statistics.json",
      "/poco/@server"
    ]
    |> Enum.map(fn endpoint -> "https://#{domain}#{endpoint}" end)
    |> urls_are_crawlable?()
  end

  @impl ApiCrawler
  def crawl(domain, nodeinfo_result) do
    details =
      case get_statistics(domain) do
        {:ok, s} -> s
        {:error, _err} -> %{}
      end
      |> convert_keys_to_atoms()
      |> (fn m ->
            %{
              version: m.version,
              user_count: m.total_users,
              status_count: m.local_posts
            }
          end).()
      |> Map.merge(nodeinfo_result)

    peers =
      case get_and_decode("https://#{domain}/poco/@server") do
        {:ok, p} -> p
        {:error, _err} -> []
      end
      |> Enum.map(fn peer ->
        peer
        |> Map.get("url")
        |> to_domain()
      end)

    if details |> Map.get(:user_count, 0) |> is_above_user_threshold?() do
      ApiCrawler.get_default()
      |> Map.merge(%{peers: peers, instance_type: :friendica})
      |> Map.merge(Map.take(details, [:description, :version, :user_count, :status_count]))
    else
      Map.merge(ApiCrawler.get_default(), nodeinfo_result)
    end
  end

  defp get_statistics(domain) do
    get_and_decode("https://#{domain}/statistics.json")
  end

  defp to_domain(url) do
    url
    |> String.replace_prefix("http://", "")
    |> String.replace_prefix("https://", "")
    |> strip_username()
  end

  # Sometimes a url at the poco/@server endpoint has the form username@domain.tld, in which case we only want domain.tld
  defp strip_username(string) do
    [_match, _username, domain] = Regex.run(~r/([\w\-_]+@)?([\w\.\-_]+)/, string)
    domain
  end
end
