defmodule Backend.Api do
  alias Backend.{Edge, Instance, Repo}
  import Backend.Util
  import Ecto.Query

  @spec get_instance!(String.t()) :: Instance.t()
  def get_instance!(domain) do
    Instance
    |> Repo.get_by!(domain: domain)
  end

  @spec get_instance_with_peers(String.t()) :: Instance.t() | nil
  def get_instance_with_peers(domain) do
    Instance
    |> preload(:peers)
    |> Repo.get_by(domain: domain)
  end

  def update_instance(instance) do
    Repo.insert(
      instance,
      on_conflict: {:replace, [:opt_in, :opt_out]},
      conflict_target: :domain
    )
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
        i.user_count >= ^user_threshold and not i.opt_out
    )
    |> maybe_filter_nodes_to_neighborhood(domain)
    |> select([c], [:domain, :user_count, :x, :y, :type, :statuses_per_day])
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
        i1.user_count >= ^user_threshold and i2.user_count >= ^user_threshold and
        not i1.opt_out and not i2.opt_out
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

  def search_instances(query, from \\ 0) do
    page_size = 50

    search_response =
      Elasticsearch.post(Backend.Elasticsearch.Cluster, "/instances/_search", %{
        "sort" => "_score",
        "from" => from,
        "size" => page_size,
        "min_score" => 1,
        "query" => %{
          "bool" => %{
            "filter" => %{
              "term" => %{
                "opt_out" => "false"
              }
            },
            "should" => [
              %{
                "multi_match" => %{
                  "query" => query,
                  "fields" => [
                    "description.english",
                    "domain.english"
                  ]
                }
              },
              %{
                "wildcard" => %{
                  "domain.keyword" => %{
                    "value" => query,
                    "boost" => 100
                  }
                }
              },
              %{
                "wildcard" => %{
                  "domain.keyword" => %{
                    "value" => "*#{query}*",
                    "boost" => 50
                  }
                }
              }
            ]
          }
        }
      })

    with {:ok, result} <- search_response do
      hits =
        get_in(result, ["hits", "hits"])
        |> Enum.map(fn h -> h |> Map.get("_source") |> convert_keys_to_atoms() end)

      next =
        if length(hits) < page_size do
          nil
        else
          from + page_size
        end

      %{
        hits: hits,
        next: next
      }
    end
  end
end
