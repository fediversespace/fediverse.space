defmodule Backend.Crawler do
  @moduledoc """
  This module crawls instances. Run `run(domain)` to crawl a given domain.
  """

  alias __MODULE__
  alias Backend.Crawler.Crawlers.{Mastodon, Misskey}
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
    :allows_crawling?,
    :result,
    :error
  ]

  @type t() :: %__MODULE__{
          domain: String.t(),
          api_crawlers: [ApiCrawler.t()],
          found_api?: boolean,
          allows_crawling?: boolean,
          result: ApiCrawler.t() | nil,
          error: String.t() | nil
        }

  def run(domain) do
    Logger.debug("Starting crawl of #{domain}")

    state = %Crawler{
      domain: domain,
      api_crawlers: [],
      found_api?: false,
      allows_crawling?: true,
      result: nil,
      error: nil
    }

    state
    # register APICrawlers here
    |> register(Mastodon)
    |> register(Misskey)
    # go!
    |> crawl()
    |> save()

    Appsignal.increment_counter("crawler.total", 1)
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

      if curr.allows_crawling?(domain) do
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
        Logger.debug("#{domain} does not allow crawling.")
        Map.put(state, :allows_crawling?, false)
      end
    else
      # Nothing found so check the next APICrawler
      Logger.debug("#{domain} is not an instance of #{curr}")
      crawl(%Crawler{state | api_crawlers: remaining_crawlers})
    end
  end

  # Save the state (after crawling) to the database.
  defp save(%Crawler{
         domain: domain,
         result: result,
         found_api?: true,
         error: nil,
         allows_crawling?: true
       }) do
    now = get_now()

    instance_type =
      case result.instance_type do
        nil -> nil
        not_nil_type -> Atom.to_string(not_nil_type)
      end

    ## Update the instance we crawled ##
    instance = %Instance{
      domain: domain,
      description: result.description,
      version: result.version,
      user_count: result.user_count,
      status_count: result.status_count,
      type: instance_type,
      base_domain: get_base_domain(domain)
    }

    Repo.insert!(
      instance,
      on_conflict:
        {:replace,
         [:description, :version, :user_count, :status_count, :type, :base_domain, :updated_at]},
      conflict_target: :domain
    )

    Elasticsearch.put_document!(Backend.Elasticsearch.Cluster, instance, "instances/_doc")

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
      |> Enum.filter(fn domain -> domain != nil and not is_blacklisted?(domain) end)
      |> Enum.map(&clean_domain(&1))

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

    Appsignal.increment_counter("crawler.success", 1)
  end

  defp save(%{domain: domain, error: error, allows_crawling?: allows_crawling}) do
    error =
      cond do
        not allows_crawling -> "robots.txt"
        error == nil -> "no api found"
        true -> "unknown error"
      end

    Repo.transaction(fn ->
      Repo.insert!(
        %Instance{
          domain: domain,
          base_domain: get_base_domain(domain)
        },
        on_conflict: {:replace, [:base_domain]},
        conflict_target: :domain
      )

      Repo.insert!(%Crawl{
        instance_domain: domain,
        error: error
      })
    end)

    Appsignal.increment_counter("crawler.failure", 1)
  end

  defp get_base_domain(domain) do
    PublicSuffix.registrable_domain(domain, ignore_private: true)
  end
end
