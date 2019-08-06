defmodule Backend.Crawler.Util do
  require Logger
  alias Backend.Repo
  import Backend.Util
  import Ecto.Query

  # Gets the domain from a Mastodon/Pleroma account URL
  # (e.g. https://mastodon.social/@demouser or https://pleroma.site/users/demouser)
  @spec get_domain(String.t()) :: String.t()
  def get_domain(url) do
    String.slice(url, 8..-1)
    |> String.split("/")
    |> Enum.at(0)
  end

  @spec is_http_200?(HTTPoison.Response.t()) :: boolean
  def is_http_200?(%{status_code: 200}) do
    true
  end

  def is_http_200?(_) do
    false
  end

  @spec is_after?(String.t(), NaiveDateTime.t() | nil) :: boolean()
  def is_after?(timestamp, threshold) do
    if threshold == nil do
      true
    else
      timestamp
      |> NaiveDateTime.from_iso8601!()
      # :second is the granularity used in the database
      |> NaiveDateTime.truncate(:second)
      |> NaiveDateTime.compare(threshold)
      |> Kernel.===(:gt)
    end
  end

  def get(url) do
    # TODO: add version number to user agent?
    HTTPoison.get(url, [{"User-Agent", get_config(:user_agent)}],
      hackney: [pool: :crawler],
      recv_timeout: 15000,
      timeout: 15000
    )
  end

  @spec get!(binary) :: %{
          :__struct__ => HTTPoison.AsyncResponse | HTTPoison.Response,
          optional(:body) => any,
          optional(:headers) => [any],
          optional(:id) => reference,
          optional(:request) => HTTPoison.Request.t(),
          optional(:request_url) => any,
          optional(:status_code) => integer
        }
  def get!(url) do
    # TODO: add version number to user agent?
    HTTPoison.get!(url, [{"User-Agent", get_config(:user_agent)}],
      hackney: [pool: :crawler],
      recv_timeout: 15000,
      timeout: 15000
    )
  end

  def post(url, body \\ "") do
    HTTPoison.post(url, body, [{"User-Agent", get_config(:user_agent)}],
      hackney: [pool: :crawler],
      recv_timeout: 15000,
      timeout: 15000
    )
  end

  def post!(url, body \\ "") do
    HTTPoison.post!(url, body, [{"User-Agent", get_config(:user_agent)}],
      hackney: [pool: :crawler],
      recv_timeout: 15000,
      timeout: 15000
    )
  end

  @spec urls_are_crawlable?([String.t()]) :: boolean()
  def urls_are_crawlable?(urls) do
    user_agent = get_config(:user_agent)

    urls
    |> Enum.all?(fn url -> Gollum.crawlable?(user_agent, url) != :uncrawlable end)
  end

  @spec has_opted_in?(String.t()) :: boolean()
  def has_opted_in?(domain) do
    case Instance |> select([:opt_in]) |> Repo.get_by(domain: domain) do
      %{opt_in: true} -> true
      _ -> false
    end
  end

  @spec is_above_user_threshold?(integer) :: boolean()
  def is_above_user_threshold?(user_count) do
    user_count > get_config(:personal_instance_threshold)
  end
end
