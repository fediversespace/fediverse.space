defmodule Backend.Crawler.ApiCrawler do
  @moduledoc """
  This module is a specification. Crawlers for all instance types must implement its behaviour.

  Make sure to respect the following:
  * You must adhere to the following configuration values:
    * `:status_age_limit_days` specifies that you must only crawl statuses from the most recent N days
    * `:status_count_limit` specifies the max number of statuses to crawl in one go
    * `:personal_instance_threshold` specifies that instances with fewer than this number of users should not be crawled (unless :opt_in is true)
  * profiles with the string "nobot" (case insensitive) in their profile must not be included in any stats
  * Make sure to check the most recent crawl of the instance so you don't re-crawl old statuses
  """

  alias Backend.Crawler.Crawlers.Nodeinfo

  # {domain_mentioned, count}
  @type instance_interactions :: %{String.t() => integer}

  @type instance_type :: :mastodon | :pleroma | :gab | :misskey | :gnusocial

  defstruct [
    :version,
    :description,
    :user_count,
    :status_count,
    :peers,
    :interactions,
    :statuses_seen,
    :instance_type
  ]

  @type t() :: %__MODULE__{
          version: String.t(),
          description: String.t(),
          user_count: integer | nil,
          status_count: integer | nil,
          peers: [String.t()],
          interactions: instance_interactions,
          statuses_seen: integer,
          instance_type: instance_type
        }

  @doc """
  Check whether the instance at the given domain is of the type that this ApiCrawler implements.
  Arguments are the instance domain and the nodeinfo results.
  """
  @callback is_instance_type?(String.t(), Nodeinfo.t()) :: boolean()

  @doc """
  Check whether the instance allows crawling according to its robots.txt or otherwise.
  """
  @callback allows_crawling?(String.t()) :: boolean()

  @doc """
  Crawl the instance at the given domain.
  Takes two arguments: the domain to crawl and the existing results (from nodeinfo).
  """
  @callback crawl(String.t(), Nodeinfo.t()) :: t()
end
