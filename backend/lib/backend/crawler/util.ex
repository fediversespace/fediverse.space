defmodule Backend.Crawler.Util do
  require Logger
  import Backend.Util

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
end
