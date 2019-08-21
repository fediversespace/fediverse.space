defmodule Backend.Crawler.Util do
  @moduledoc false
  require Logger
  alias Backend.{Instance, Repo}
  import Backend.Util
  import Ecto.Query

  # Gets the domain from a Mastodon/Pleroma account URL
  # (e.g. https://mastodon.social/@demouser or https://pleroma.site/users/demouser)
  @spec get_domain(String.t()) :: String.t()
  def get_domain(url) do
    [_match, domain] = Regex.run(~r/https?:\/\/([\w.-]+)\/.*/, url)
    domain
  end

  @doc """
  Returns true if the first argument is after the second.
  """
  @spec is_after?(NaiveDateTime.t(), NaiveDateTime.t() | nil) :: boolean()
  def is_after?(timestamp, threshold) do
    if threshold == nil do
      true
    else
      timestamp
      # :second is the granularity used in the database
      |> NaiveDateTime.truncate(:second)
      |> NaiveDateTime.compare(threshold)
      |> Kernel.===(:gt)
    end
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
