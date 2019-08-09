defmodule Backend.Util do
  import Ecto.Query
  require Logger
  alias Backend.{Crawl, Repo}

  @doc """
  Returns the given key from :backend, :crawler in the config.
  """
  @spec get_config(atom) :: any
  def get_config(key) do
    Application.get_env(:backend, :crawler)[key]
  end

  @doc """
  Takes two lists and returns a list of the union thereof (without duplicates).
  """
  def list_union(list_one, list_two) do
    list_one
    |> MapSet.new()
    |> (fn set -> MapSet.union(set, MapSet.new(list_two)) end).()
    |> MapSet.to_list()
  end

  @doc """
  Returns `true` if `domain` ends with a blacklisted domain.
  If e.g. "masto.host" is blacklisted, allof its subdomains will return `true`.
  """
  @spec is_blacklisted?(String.t()) :: boolean
  def is_blacklisted?(domain) do
    blacklist =
      case get_config(:blacklist) do
        nil -> []
        other -> other
      end

    blacklist
    |> Enum.any?(fn blacklisted_domain ->
      String.ends_with?(domain, blacklisted_domain)
    end)
  end

  @doc """
  Returns the key to use for non-directed edges
  (really, just the two domains sorted alphabetically)
  """
  @spec get_interaction_key(String.t(), String.t()) :: String.t()
  def get_interaction_key(source, target) do
    [source, target]
    |> Enum.sort()
    |> List.to_tuple()
  end

  @doc """
  Gets the current UTC time as a NaiveDateTime in a format that can be inserted into the database.
  """
  def get_now() do
    NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)
  end

  @doc """
  Returns the later of two NaiveDateTimes.
  """
  @spec max_datetime(NaiveDateTime.t() | nil, NaiveDateTime.t() | nil) :: NaiveDateTime.t()
  def max_datetime(datetime_one, nil) do
    datetime_one
  end

  def max_datetime(nil, datetime_two) do
    datetime_two
  end

  def max_datetime(datetime_one, datetime_two) do
    case NaiveDateTime.compare(datetime_one, datetime_two) do
      :gt -> datetime_one
      _ -> datetime_two
    end
  end

  @spec get_last_crawl(String.t()) :: Crawl.t() | nil
  def get_last_crawl(domain) do
    Crawl
    |> select([c], c)
    |> where([c], c.instance_domain == ^domain)
    |> order_by(desc: :id)
    |> limit(1)
    |> Repo.one()
  end

  @spec get_last_crawl_timestamp(String.t()) :: NaiveDateTime.t() | nil
  def get_last_crawl_timestamp(domain) do
    crawl = get_last_crawl(domain)

    case crawl do
      nil -> nil
      _ -> crawl.inserted_at
    end
  end

  @doc """
  Takes two maps with numeric values and merges them, adding the values of duplicate keys.
  """
  def merge_count_maps(map1, map2) do
    map1
    |> Enum.reduce(map2, fn {key, val}, acc ->
      Map.update(acc, key, val, &(&1 + val))
    end)
  end

  @doc """
  Sends an SMS to the admin phone number if configured.
  """
  def send_admin_sms(body) do
    if get_config(:admin_phone) != nil and get_config(:twilio_phone) != nil do
      ExTwilio.Message.create(
        to: get_config(:admin_phone),
        from: get_config(:twilio_phone),
        body: body
      )
    else
      Logger.info("Could not send SMS to admin; not configured.")
    end
  end

  def clean_domain(domain) do
    domain
    |> String.replace_prefix("https://", "")
    |> String.trim_trailing("/")
    |> String.downcase()
  end

  def get_account(username, domain) do
    if username == nil or domain == nil do
      nil
    else
      "#{String.downcase(username)}@#{clean_domain(domain)}"
    end
  end

  @doc """
  Converts a map with string keys to a map with atom keys.
  Be very careful with this -- only use it on maps where you know the keys! Never run it if the keys can be supplied
  by the user.
  """
  # sobelow_skip ["DOS.StringToAtom"]
  def convert_keys_to_atoms(map) do
    map |> Map.new(fn {k, v} -> {String.to_atom(k), v} end)
  end

  @doc """
  Gets and decodes a HTTP response.
  """
  @spec get_and_decode(String.t()) ::
          {:ok, any()} | {:error, Jason.DecodeError.t() | HTTPoison.Error.t()}
  def get_and_decode(url) do
    case HTTPoison.get(url, [{"User-Agent", get_config(:user_agent)}],
           hackney: [pool: :crawler],
           recv_timeout: 15000,
           timeout: 15000
         ) do
      {:ok, %{status_code: 200, body: body}} -> Jason.decode(body)
      {:ok, _} -> {:error, %HTTPoison.Error{reason: "Non-200 response"}}
      {:error, err} -> {:error, err}
    end
  end

  @spec get_and_decode!(String.t()) :: any()
  def get_and_decode!(url) do
    case get_and_decode(url) do
      {:ok, decoded} -> decoded
      {:error, error} -> raise error
    end
  end

  @doc """
  POSTS to a HTTP endpoint and decodes the JSON response.
  """
  @spec post_and_decode(String.t(), String.t()) ::
          {:ok, any()} | {:error, Jason.DecodeError.t() | HTTPoison.Error.t()}
  def post_and_decode(url, body \\ "") do
    case HTTPoison.post(url, body, [{"User-Agent", get_config(:user_agent)}],
           hackney: [pool: :crawler],
           recv_timeout: 15000,
           timeout: 15000
         ) do
      {:ok, %{status_code: 200, body: response_body}} -> Jason.decode(response_body)
      {:ok, _} -> {:error, %HTTPoison.Error{reason: "Non-200 response"}}
      {:error, err} -> {:error, err}
    end
  end

  @spec post_and_decode!(String.t(), String.t()) :: any()
  def post_and_decode!(url, body \\ "") do
    case post_and_decode(url, body) do
      {:ok, decoded} -> decoded
      {:error, error} -> raise error
    end
  end
end
