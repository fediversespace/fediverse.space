defmodule Backend.Crawler do
  @moduledoc """
  This module crawls instances. Run `run(domain)` to crawl a given domain.
  """

  alias __MODULE__
  alias Backend.Crawler.Crawlers.Mastodon
  alias Backend.Crawler.ApiCrawler
  alias Backend.{Crawl, CrawlInteraction, Repo, Instance, InstancePeer}
  import Ecto.Query
  import Backend.Util
  require Logger

  defstruct [
    # the instance domain (a string)
    :domain,
    # a list of ApiCrawlers that will be attempted
    :api_crawlers,
    :found_api?,
    :result,
    :error
  ]

  @type t() :: %__MODULE__{
          domain: String.t(),
          api_crawlers: [ApiCrawler.t()],
          found_api?: boolean,
          result: ApiCrawler.t() | nil,
          error: String.t() | nil
        }

  def run(domain) do
    Logger.info("Crawling #{domain}...")
    HTTPoison.start()
    state = %Crawler{domain: domain, api_crawlers: [], found_api?: false, result: nil, error: nil}

    state
    # register APICrawlers here
    |> register(Mastodon)
    # go!
    |> crawl()
    |> save()
  end

  # Adds a new ApiCrawler that run/1 will check.
  defp register(%Crawler{api_crawlers: crawlers} = state, api_crawler) do
    Map.put(state, :api_crawlers, [api_crawler | crawlers])
  end

  # Recursive function to check whether `domain` has an API that the head of the api_crawlers list can read.
  # If so, crawls it. If not, continues with the tail of the api_crawlers list.
  defp crawl(%Crawler{api_crawlers: [], domain: domain} = state) do
    Logger.debug("Found no compatible API for #{domain}")
    Map.put(state, :found_api?, false)
  end

  defp crawl(%Crawler{domain: domain, api_crawlers: [curr | remaining_crawlers]} = state) do
    if curr.is_instance_type?(domain) do
      Logger.debug("Found #{curr} instance")
      state = Map.put(state, :found_api?, true)

      try do
        %Crawler{state | result: curr.crawl(domain), api_crawlers: []}
      rescue
        e in HTTPoison.Error ->
          Map.put(state, :error, "HTTPoison error: " <> HTTPoison.Error.message(e))

        e in Jason.DecodeError ->
          Map.put(state, :error, "Jason DecodeError: " <> Jason.DecodeError.message(e))

        e in _ ->
          Map.put(state, :error, "Unknown error: " <> inspect(e))
      end
    else
      # Nothing found so check the next APICrawler
      Logger.debug("#{domain} is not an instance of #{curr}")
      crawl(%Crawler{state | api_crawlers: remaining_crawlers})
    end
  end

  # Save the state (after crawling) to the database.
  defp save(%Crawler{domain: domain, result: result, found_api?: true, error: nil}) do
    now = get_now()

    ## Update the instance we crawled ##
    Repo.insert!(
      %Instance{
        domain: domain,
        description: result.description,
        version: result.version,
        user_count: result.user_count,
        status_count: result.status_count
      },
      on_conflict: [
        set: [
          description: result.description,
          version: result.version,
          user_count: result.user_count,
          status_count: result.status_count,
          updated_at: now
        ]
      ],
      conflict_target: :domain
    )

    # Save details of a new crawl
    curr_crawl =
      Repo.insert!(%Crawl{
        instance_domain: domain,
        interactions_seen:
          result.interactions |> Map.values() |> Enum.reduce(0, fn count, acc -> count + acc end),
        statuses_seen: result.statuses_seen
      })

    # We get a list of peers from two places:
    # * the official peers endpoint (which may be disabled)
    # * the interactions
    peers_domains =
      result.interactions
      |> Map.keys()
      |> list_union(result.peers)
      |> Enum.filter(fn domain -> not is_blacklisted?(domain) end)

    peers =
      peers_domains
      |> Enum.map(&%{domain: &1, inserted_at: now, updated_at: now})

    Instance
    |> Repo.insert_all(peers, on_conflict: :nothing, conflict_target: :domain)

    Repo.transaction(fn ->
      ## Save peer relationships ##
      # get current peers (a list of strings)
      current_peers =
        InstancePeer
        |> where(source_domain: ^domain)
        |> select([p], p.target_domain)
        |> Repo.all()

      wanted_peers_set = MapSet.new(peers_domains)
      current_peers_set = MapSet.new(current_peers)

      # delete the peers we don't want
      dont_want = current_peers_set |> MapSet.difference(wanted_peers_set) |> MapSet.to_list()

      if length(dont_want) > 0 do
        InstancePeer
        |> where(source_domain: ^domain)
        |> where([p], p.target_domain in ^dont_want)
        |> Repo.delete_all([])
      end

      # insert the ones we don't have yet
      new_instance_peers =
        wanted_peers_set
        |> MapSet.difference(current_peers_set)
        |> MapSet.to_list()
        |> Enum.map(
          &%{
            source_domain: domain,
            target_domain: &1,
            inserted_at: now,
            updated_at: now
          }
        )

      InstancePeer
      |> Repo.insert_all(new_instance_peers)
    end)

    ## Save interactions ##
    interactions =
      result.interactions
      |> Enum.filter(fn {target_domain, _count} -> not is_blacklisted?(target_domain) end)
      |> Enum.map(fn {target_domain, count} ->
        %{
          crawl_id: curr_crawl.id,
          source_domain: domain,
          target_domain: target_domain,
          mentions: count,
          inserted_at: now,
          updated_at: now
        }
      end)

    CrawlInteraction
    |> Repo.insert_all(interactions)
  end

  defp save(%{domain: domain, error: error}) do
    Repo.insert!(%Crawl{
      instance_domain: domain,
      error: error
    })
  end
end
