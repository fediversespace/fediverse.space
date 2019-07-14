defmodule Backend.Api do
  alias Backend.{Crawl, Edge, Instance, Repo}
  import Ecto.Query

  @spec list_instances() :: [Instance.t()]
  def list_instances() do
    Instance
    |> Repo.all()
  end

  @spec get_instance!(String.t()) :: Instance.t()
  def get_instance!(domain) do
    Instance
    |> preload(:peers)
    |> Repo.get_by!(domain: domain)
  end

  @doc """
  Returns a list of instances that
  * have at least one successful crawl
  * have a user count (required to give the instance a size on the graph)
  """
  @spec list_nodes() :: [Instance.t()]
  def list_nodes() do
    crawl_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        crawl_count: count(c.id)
      })
      |> where([c], is_nil(c.error))
      |> group_by([c], c.instance_domain)

    Instance
    |> join(:inner, [i], c in subquery(crawl_subquery), on: i.domain == c.instance_domain)
    |> where(
      [i, c],
      c.crawl_count > 0 and not is_nil(i.user_count) and not is_nil(i.x) and not is_nil(i.y)
    )
    |> select([c], [:domain, :user_count, :x, :y])
    |> Repo.all()
  end

  @spec list_edges() :: [Edge.t()]
  def list_edges() do
    crawl_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        crawl_count: count(c.id)
      })
      |> where([c], is_nil(c.error))
      |> group_by([c], c.instance_domain)

    Edge
    |> join(:inner, [e], c1 in subquery(crawl_subquery), on: e.source_domain == c1.instance_domain)
    |> join(:inner, [e], c2 in subquery(crawl_subquery), on: e.target_domain == c2.instance_domain)
    |> join(:inner, [e], i1 in Instance, on: e.source_domain == i1.domain)
    |> join(:inner, [e], i2 in Instance, on: e.target_domain == i2.domain)
    |> select([e], [:id, :source_domain, :target_domain, :weight])
    |> where(
      [e, c1, c2, i1, i2],
      c1.crawl_count > 0 and c2.crawl_count > 0 and not is_nil(i1.x) and not is_nil(i1.y) and
        not is_nil(i2.x) and not is_nil(i2.y) and e.source_domain != e.target_domain
    )
    |> Repo.all()
  end
end
