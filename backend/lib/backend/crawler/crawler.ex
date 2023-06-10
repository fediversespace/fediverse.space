defmodule Backend.Crawler do
  @moduledoc """
  This module crawls instances. Run `run(domain)` to crawl a given domain.
  """

  alias __MODULE__

  alias Backend.{
    Crawl,
    CrawlInteraction,
    FederationRestriction,
    Instance,
    InstancePeer,
    MostRecentCrawl,
    Repo
  }

  alias Backend.Crawler.ApiCrawler
  alias Backend.Crawler.Crawlers.{Friendica, GnuSocial, Mastodon, Misskey, Nodeinfo}

  import Ecto.Query
  import Backend.Util

  require Logger

  defstruct [
    # the instance domain (a string)
    :domain,
    # a list of ApiCrawlers that will be attempted
    :api_crawlers,
    :allows_crawling?,
    :found_api?,
    :result,
    :error
  ]

  @type t() :: %__MODULE__{
          domain: String.t(),
          api_crawlers: [ApiCrawler.t()],
          allows_crawling?: boolean,
          found_api?: boolean,
          result: ApiCrawler.t() | nil,
          error: String.t() | nil
        }

  def run(domain) do
    Logger.debug("Starting crawl of #{domain}")

    state = %Crawler{
      domain: domain,
      api_crawlers: [],
      allows_crawling?: true,
      found_api?: false,
      result: nil,
      error: nil
    }

    state
    # These crawlers are run in the order they're registered. Nodeinfo should be the first one.
    |> register(Nodeinfo)
    |> register(Mastodon)
    |> register(Misskey)
    |> register(GnuSocial)
    |> register(Friendica)
    # go!
    |> crawl()
    |> save()

    Appsignal.increment_counter("crawler.total", 1)
  end

  # Adds a new ApiCrawler that run/1 will check.
  defp register(%Crawler{api_crawlers: crawlers} = state, api_crawler) do
    Map.put(state, :api_crawlers, crawlers ++ [api_crawler])
  end

  # Recursive function to check whether `domain` has an API that the head of the api_crawlers list can read.
  # If so, crawls it. If not, continues with the tail of the api_crawlers list.
  defp crawl(%Crawler{api_crawlers: [], domain: domain} = state) do
    Logger.debug("Found no compatible API for #{domain}")
    state
  end

  # Nodeinfo is distinct from other crawlers in that
  # a) it should always be run first
  # b) it passes the results on to the next crawlers (e.g. user_count)
  defp crawl(%Crawler{api_crawlers: [Nodeinfo | remaining_crawlers], domain: domain} = state) do
    if Nodeinfo.allows_crawling?(domain) do
      nodeinfo = Nodeinfo.crawl(domain, nil)

      if nodeinfo != nil do
        Logger.debug("Found nodeinfo for #{domain}.")

        crawl(%Crawler{
          state
          | result: nodeinfo,
            found_api?: true,
            api_crawlers: remaining_crawlers
        })
      else
        Logger.debug("Did not find nodeinfo for #{domain}.")
        crawl(%Crawler{state | api_crawlers: remaining_crawlers})
      end
    else
      crawl(%Crawler{state | api_crawlers: remaining_crawlers, allows_crawling?: false})
    end
  end

  defp crawl(
         %Crawler{domain: domain, result: result, api_crawlers: [curr | remaining_crawlers]} =
           state
       ) do
    if curr.is_instance_type?(domain, result) do
      Logger.debug("Found #{curr} instance")

      if curr.allows_crawling?(domain) do
        try do
          %Crawler{state | result: curr.crawl(domain, result), found_api?: true}
        rescue
          e in Backend.HttpBehaviour.Error ->
            Map.put(state, :error, "HTTP error: " <> e.message)

          e in Jason.DecodeError ->
            Map.put(state, :error, "Jason DecodeError: " <> Jason.DecodeError.message(e))
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

  ## Save the state (after crawling) to the database. ##

  # If we didn't get a server type, the crawl wasn't successful.
  defp save(%Crawler{result: %{type: nil}} = state) do
    save_error(state)
  end

  defp save(%Crawler{
         domain: domain,
         result: result,
         error: nil,
         allows_crawling?: true,
         found_api?: true
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
      description: HtmlSanitizeEx.basic_html(result.description),
      version: HtmlSanitizeEx.basic_html(result.version),
      user_count: result.user_count,
      status_count: result.status_count,
      type: instance_type,
      base_domain: get_base_domain(domain),
      next_crawl: NaiveDateTime.add(now, get_config(:crawl_interval_mins) * 60, :second),
      crawl_error: nil,
      crawl_error_count: 0
    }

    Repo.insert!(
      instance,
      on_conflict:
        {:replace,
         [
           :description,
           :version,
           :user_count,
           :status_count,
           :type,
           :base_domain,
           :updated_at,
           :next_crawl,
           :crawl_error,
           :crawl_error_count
         ]},
      conflict_target: :domain
    )

    Elasticsearch.put_document!(Backend.Elasticsearch.Cluster, instance, "instances/_doc")

    ## Save details of a new crawl ##
    curr_crawl =
      Repo.insert!(%Crawl{
        instance_domain: domain,
        interactions_seen:
          result.interactions
          |> Map.values()
          |> Enum.reduce(0, fn count, acc -> count + acc end),
        statuses_seen: result.statuses_seen
      })

    Repo.insert!(
      %MostRecentCrawl{
        instance_domain: domain,
        crawl_id: curr_crawl.id,
        inserted_at: now,
        updated_at: now
      },
      on_conflict: {:replace, [:crawl_id, :updated_at]},
      conflict_target: :instance_domain
    )

    # We get a list of peers from two places:
    # * the official peers endpoint (which may be disabled)
    # * the interactions
    peers_domains =
      result.interactions
      |> Map.keys()
      |> list_union(result.peers)
      |> Enum.filter(fn domain -> domain != nil and not is_blacklisted?(domain) end)
      |> Enum.map(&clean_domain(&1))
      |> Enum.filter(fn peer_domain ->
        if is_valid_domain?(peer_domain) do
          true
        else
          Logger.info("Found invalid peer domain from #{domain}: #{peer_domain}")
          false
        end
      end)

    new_instances =
      peers_domains
      |> list_union(
        Enum.map(result.federation_restrictions, fn {domain, _restriction_type} -> domain end)
      )
      |> Enum.map(&%{domain: &1, inserted_at: now, updated_at: now, next_crawl: now})
      |> Enum.chunk_every(5000)

    new_instances
    |> Enum.each(fn chunk ->
      Repo.insert_all(Instance, chunk, on_conflict: :nothing, conflict_target: :domain)
    end)

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
        |> Enum.chunk_every(5000)

      new_instance_peers
      |> Enum.each(fn chunk -> Repo.insert_all(InstancePeer, chunk) end)
    end)

    ## Save federation restrictions ##
    Repo.transaction(fn ->
      current_restrictions =
        FederationRestriction
        |> select([fr], {fr.target_domain, fr.type})
        |> where(source_domain: ^domain)
        |> Repo.all()

      wanted_restrictions_set =
        result.federation_restrictions
        |> MapSet.new()

      current_restrictions_set = MapSet.new(current_restrictions)

      # Delete the ones we don't want
      restrictions_to_delete =
        current_restrictions_set
        |> MapSet.difference(wanted_restrictions_set)
        |> MapSet.to_list()
        |> Enum.map(fn {target_domain, _type} -> target_domain end)

      if length(restrictions_to_delete) > 0 do
        FederationRestriction
        |> where(
          [fr],
          fr.source_domain == ^domain and fr.target_domain in ^restrictions_to_delete
        )
        |> Repo.delete_all()
      end

      # Save the new ones
      new_restrictions =
        wanted_restrictions_set
        |> MapSet.difference(current_restrictions_set)
        |> MapSet.to_list()
        |> Enum.map(fn {target_domain, type} ->
          %{
            source_domain: domain,
            target_domain: target_domain,
            type: type,
            inserted_at: now,
            updated_at: now
          }
        end)

      FederationRestriction
      |> Repo.insert_all(new_restrictions)
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

  defp save(state) do
    save_error(state)
  end

  defp save_error(%{domain: domain, error: error, allows_crawling?: allows_crawling}) do
    now = get_now()

    error =
      cond do
        not allows_crawling -> "robots.txt"
        error == nil -> "no api found"
        true -> error
      end

    # The "+1" is this error!
    error_count =
      Instance
      |> Repo.get_by!(domain: domain)
      |> Map.get(:crawl_error_count)
      |> Kernel.+(1)

    # The crawl interval grows exponentially at first but never goes above 24 hours
    crawl_interval_mins =
      min(get_config(:crawl_interval_mins) * round(:math.pow(2, error_count)), 1440)

    next_crawl = NaiveDateTime.add(now, crawl_interval_mins * 60, :second)

    Repo.insert!(
      %Instance{
        domain: domain,
        base_domain: get_base_domain(domain),
        crawl_error: error,
        crawl_error_count: error_count,
        next_crawl: next_crawl,
        updated_at: now
      },
      on_conflict:
        {:replace, [:base_domain, :crawl_error, :crawl_error_count, :next_crawl, :updated_at]},
      conflict_target: :domain
    )

    Appsignal.increment_counter("crawler.failure", 1)
  end

  defp get_base_domain(domain) do
    PublicSuffix.registrable_domain(domain, ignore_private: true)
  end
end
