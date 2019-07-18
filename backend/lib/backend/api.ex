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
  * have a user count (required to give the instance a size on the graph)
  * have x and y coordinates
  """
  @spec list_nodes() :: [Instance.t()]
  def list_nodes() do
    Instance
    |> where([i], not is_nil(i.x) and not is_nil(i.y) and not is_nil(i.user_count))
    |> select([c], [:domain, :user_count, :x, :y])
    |> Repo.all()
  end

  @spec list_edges() :: [Edge.t()]
  def list_edges() do
    Edge
    |> join(:inner, [e], i1 in Instance, on: e.source_domain == i1.domain)
    |> join(:inner, [e], i2 in Instance, on: e.target_domain == i2.domain)
    |> select([e], [:id, :source_domain, :target_domain, :weight])
    |> where(
      [e, i1, i2],
      not is_nil(i1.x) and not is_nil(i1.y) and
        not is_nil(i2.x) and not is_nil(i2.y)
    )
    |> Repo.all()
  end
end
