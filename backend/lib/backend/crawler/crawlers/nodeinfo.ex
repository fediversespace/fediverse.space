defmodule Backend.Crawler.Crawlers.Nodeinfo do
  alias Backend.Crawler.ApiCrawler
  require Logger
  import Backend.Util
  import Backend.Crawler.Util

  @moduledoc """
  This module is slightly different from the other crawlers.
  It doesn't implement the ApiCrawler spec because it isn't run as a self-contained crawler.
  Instead, it's run before all the other crawlers.

  This is to get the user count. Some servers don't publish this in other places (e.g. GNU Social, PeerTube) so we need
  nodeinfo to know whether it's a personal instance or not.
  """

  defstruct [
    :description,
    :user_count,
    :status_count,
    :instance_type,
    :version
  ]

  @type t() :: %__MODULE__{
          description: String.t(),
          user_count: integer,
          status_count: integer,
          instance_type: ApiCrawler.instance_type(),
          version: String.t()
        }

  @spec allows_crawling?(String.t()) :: boolean()
  def allows_crawling?(domain) do
    [
      ".well-known/nodeinfo"
    ]
    |> Enum.map(fn endpoint -> "https://#{domain}#{endpoint}" end)
    |> urls_are_crawlable?()
  end

  @spec crawl(String.t()) :: {:ok, t()} | {:error, nil}
  def crawl(domain) do
    with {:ok, nodeinfo_url} <- get_nodeinfo_url(domain),
         {:ok, nodeinfo} <- get_nodeinfo(nodeinfo_url) do
      {:ok, nodeinfo}
    else
      _other -> {:error, nil}
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

  @spec get_nodeinfo(String.t()) ::
          {:ok, t()} | {:error, Jason.DecodeError.t() | HTTPoison.Error.t()}
  defp get_nodeinfo(nodeinfo_url) do
    case get_and_decode(nodeinfo_url) do
      {:ok, nodeinfo} -> {:ok, process_nodeinfo(nodeinfo)}
      {:error, err} -> {:error, err}
    end
  end

  @spec process_nodeinfo(any()) :: t()
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

      %__MODULE__{
        description: description,
        user_count: user_count,
        status_count: get_in(nodeinfo, ["usage", "localPosts"]),
        instance_type: type,
        version: get_in(nodeinfo, ["software", "version"])
      }
    else
      %{
        description: nil,
        user_count: user_count,
        status_count: nil,
        instance_type: nil,
        version: nil
      }
    end
  end

  @spec is_compatible_nodeinfo_version?(String.t()) :: boolean()
  defp is_compatible_nodeinfo_version?(schema_url) do
    version = String.slice(schema_url, (String.length(schema_url) - 3)..-1)
    Enum.member?(["1.0", "1.1", "2.0"], version)
  end
end
