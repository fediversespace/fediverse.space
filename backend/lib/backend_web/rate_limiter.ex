defmodule BackendWeb.RateLimiter do
  @moduledoc """
  Functions used to rate limit:
  * all endpoints by IP/endpoint
  * authentication endpoints by domain
  """

  import Phoenix.Controller, only: [json: 2]
  import Plug.Conn, only: [put_status: 2]
  use Plug.Builder

  def rate_limit(conn, options \\ []) do
    case check_rate(conn, options) do
      {:ok, _count}   -> conn # Do nothing, allow execution to continue
      {:error, _count} -> render_error(conn)
    end
  end

  def rate_limit_authentication(conn, options \\ []) do
    domain =
      if Map.has_key?(conn.params, "id") do
        Map.get(conn.params, "id")
      else
        Map.get(conn.params, "domain")
      end
    options = Keyword.put(options, :bucket_name, "authorization: #{domain}")
    rate_limit(conn, options)
  end

  defp check_rate(conn, options) do
    interval_milliseconds = options[:interval_seconds] * 1000
    max_requests = options[:max_requests]
    bucket_name = options[:bucket_name] || bucket_name(conn)

    ExRated.check_rate(bucket_name, interval_milliseconds, max_requests)
  end

  # Bucket name should be a combination of ip address and request path, like so:
  #
  # "127.0.0.1:/api/v1/authorizations"
  defp bucket_name(conn) do
    path = Enum.join(conn.path_info, "/")
    ip   = conn.remote_ip |> Tuple.to_list |> Enum.join(".")
    "#{ip}:#{path}"
  end

  defp render_error(conn) do
    conn
    |> put_status(:forbidden)
    |> json(%{error: "Rate limit exceeded."})
    |> halt # Stop execution of further plugs, return response now
  end
end
