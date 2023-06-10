defmodule Backend.Http do
  @moduledoc """
  A wrapper around HTTPoison. Using this wrapper makes it easy for us
  to mock web responses in tests, and we can easily switch out HTTPoison for
  another library if we want to.
  """
  @behaviour Backend.HttpBehaviour
  alias Backend.HttpBehaviour.Error

  import Backend.Util

  @doc """
  GETs from the given URL and returns the JSON-decoded response.
  If the response is unsuccessful and a default value is given, this returns the default value.
  Otherwise, unsuccessful responses return an error.
  """
  @impl true
  def get_and_decode(url, pool \\ :default, timeout \\ 15_000, default \\ nil) do
    case HTTPoison.get(url, [{"User-Agent", get_config(:user_agent)}],
           hackney: [pool: pool],
           recv_timeout: timeout,
           timeout: timeout
         ) do
      {:ok, %HTTPoison.Response{body: body, status_code: status_code}}
      when status_code >= 200 and status_code <= 299 ->
        Jason.decode(body)

      {:ok, %HTTPoison.Response{body: body, status_code: status_code}} ->
        if not is_nil(default) do
          {:ok, default}
        else
          {:error,
           %Error{
             message: "HTTP request failed with status code #{status_code}",
             status_code: status_code,
             body: body
           }}
        end

      {:error, %HTTPoison.Error{} = error} ->
        {:error, %Error{message: HTTPoison.Error.message(error)}}
    end
  end

  @impl true
  def get_and_decode!(url, pool \\ :default, timeout \\ 15_000, default \\ nil) do
    case get_and_decode(url, pool, timeout, default) do
      {:ok, decoded} -> decoded
      {:error, error} -> raise error
    end
  end

  @impl true
  def post_and_decode(url, body \\ nil) do
    case HTTPoison.post(url, body, [{"User-Agent", get_config(:user_agent)}]) do
      {:ok, %HTTPoison.Response{body: body}} ->
        Jason.decode(body)

      {:error, %HTTPoison.Error{} = error} ->
        {:error, %Error{message: HTTPoison.Error.message(error)}}
    end
  end

  @impl true
  def post_and_decode!(url, body \\ nil) do
    case post_and_decode(url, body) do
      {:ok, decoded} -> decoded
      {:error, error} -> raise error
    end
  end
end
