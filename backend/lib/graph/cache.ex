defmodule Graph.Cache do
  @moduledoc false
  use Nebulex.Cache,
    otp_app: :backend,
    adapter: Nebulex.Adapters.Local

  alias Backend.{Api, Crawl, Edge, Instance, MostRecentCrawl, Repo}
  alias __MODULE__
  require Logger
  import Ecto.Query

  @spec get_graph(String.t() | nil) :: %{
          nodes: [Instance.t()],
          edges: [Edge.t()]
        }
  def get_graph(domain \\ nil) do
    key =
      if domain != nil do
        "graph_" <> domain
      else
        "graph"
      end

    case Cache.get(key) do
      nil ->
        Appsignal.increment_counter("graph_cache.misses", 1)
        Logger.debug("Graph cache: miss")
        nodes = Api.list_nodes(domain)
        edges = Api.list_edges(domain)
        # Cache for 10 minutes
        Cache.set(key, %{nodes: nodes, edges: edges}, ttl: 600)
        %{nodes: nodes, edges: edges}

      data ->
        Appsignal.increment_counter("graph_cache.hits", 1)
        Logger.debug("Graph cache: hit")
        data
    end
  end

  @spec get_instance_with_relationships(String.t()) :: Instance.t()
  def get_instance_with_relationships(domain) do
    key = "instance_" <> domain

    case Cache.get(key) do
      nil ->
        Appsignal.increment_counter("instance_cache.misses", 1)
        Logger.debug("Instance cache: miss")
        instance = Api.get_instance_with_relationships(domain)
        # Cache for five minutes
        Cache.set(key, instance, ttl: 300)
        instance

      data ->
        Appsignal.increment_counter("instance_cache.hits", 1)
        Logger.debug("Instance cache: hit")
        data
    end
  end

  @spec get_last_crawl(String.t()) :: Crawl.t() | nil
  def get_last_crawl(domain) do
    key = "most_recent_crawl_" <> domain

    most_recent_crawl_subquery =
      MostRecentCrawl
      |> select([mrc], %{
        most_recent_id: mrc.crawl_id
      })
      |> where([mrc], mrc.instance_domain == ^domain)

    case Cache.get(key) do
      nil ->
        Appsignal.increment_counter("most_recent_crawl_cache.misses", 1)
        Logger.debug("Most recent crawl cache: miss")

        crawl =
          Crawl
          |> join(:inner, [c], mrc in subquery(most_recent_crawl_subquery),
            on: c.id == mrc.most_recent_id
          )
          |> Repo.one()

        # Cache for five minutes
        Cache.set(key, crawl, ttl: 300)

      data ->
        Appsignal.increment_counter("most_recent_crawl_cache.hits", 1)
        Logger.debug("Most recent crawl cache: hit")
        data
    end
  end
end
