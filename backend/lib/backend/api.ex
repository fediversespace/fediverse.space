defmodule Backend.Api do
  alias Backend.{Edge, Instance, Repo}
  import Backend.Util
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
  * the user count is > the threshold
  * have x and y coordinates

  If `domain` is passed, then this function only returns nodes that are neighbors of that instance.
  """
  @spec list_nodes() :: [Instance.t()]
  def list_nodes(domain \\ nil) do
    user_threshold = get_config(:personal_instance_threshold)

    Instance
    |> where(
      [i],
      not is_nil(i.x) and not is_nil(i.y) and not is_nil(i.user_count) and
        i.user_count >= ^user_threshold
    )
    |> maybe_filter_nodes_to_neighborhood(domain)
    |> select([c], [:domain, :user_count, :x, :y])
    |> Repo.all()
  end

  # if we're getting the sub-graph around a given domain, only return neighbors.
  defp maybe_filter_nodes_to_neighborhood(query, domain) do
    case domain do
      nil ->
        query

      _ ->
        query
        |> join(:inner, [i], outgoing_edges in Edge, on: outgoing_edges.source_domain == i.domain)
        |> join(:inner, [i], incoming_edges in Edge, on: incoming_edges.target_domain == i.domain)
        |> where(
          [i, outgoing_edges, incoming_edges],
          outgoing_edges.target_domain == ^domain or incoming_edges.source_domain == ^domain or
            i.domain == ^domain
        )
        |> distinct(true)
    end
  end

  @spec list_edges() :: [Edge.t()]
  def list_edges(domain \\ nil) do
    user_threshold = get_config(:personal_instance_threshold)

    Edge
    |> join(:inner, [e], i1 in Instance, on: e.source_domain == i1.domain)
    |> join(:inner, [e], i2 in Instance, on: e.target_domain == i2.domain)
    |> maybe_filter_edges_to_neighborhood(domain)
    |> select([e], [:id, :source_domain, :target_domain, :weight])
    |> where(
      [e, i1, i2],
      not is_nil(i1.x) and not is_nil(i1.y) and
        not is_nil(i2.x) and not is_nil(i2.y) and
        i1.user_count >= ^user_threshold and i2.user_count >= ^user_threshold
    )
    |> Repo.all()
  end

  defp maybe_filter_edges_to_neighborhood(query, domain) do
    case domain do
      nil ->
        query

      _ ->
        # we want all edges in the neighborhood -- not just edges connected to `domain`
        query
        |> join(:inner, [e], neighbor_edges in Edge,
          on:
            neighbor_edges.source_domain == e.target_domain or
              neighbor_edges.target_domain == e.source_domain
        )
        |> where(
          [e, i1, i2, neighbor_edges],
          e.source_domain == ^domain or e.target_domain == ^domain or
            neighbor_edges.source_domain == ^domain or neighbor_edges.target_domain == ^domain
        )
        |> distinct(true)
    end
  end

  def search_instances(query, cursor_after \\ nil) do
    ilike_query = "%#{query}%"

    %{entries: instances, metadata: metadata} =
      Instance
      |> where([i], ilike(i.domain, ^ilike_query))
      |> order_by(asc: :id)
      |> Repo.paginate(after: cursor_after, cursor_fields: [:id], limit: 50)

    %{instances: instances, next: metadata.after}
  end
end
