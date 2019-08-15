defmodule BackendWeb.GraphView do
  use BackendWeb, :view
  alias BackendWeb.GraphView

  def render("index.json", %{nodes: nodes, edges: edges}) do
    statuses_per_day =
      nodes
      |> Enum.map(fn %{statuses_per_day: statuses_per_day} -> statuses_per_day end)
      |> Enum.filter(fn s -> s != nil end)

    %{
      graph: %{
        nodes: render_many(nodes, GraphView, "node.json", as: :node),
        edges: render_many(edges, GraphView, "edge.json", as: :edge)
      },
      metadata: %{
        ranges: %{
          # Make sure that these keys match what's in the "node.json" render function.
          statusesPerDay: [
            Enum.min(statuses_per_day, fn -> nil end),
            Enum.max(statuses_per_day, fn -> nil end)
          ]
        }
      }
    }
  end

  def render("node.json", %{node: node}) do
    size =
      case node.user_count > 1 do
        true -> :math.log(node.user_count)
        false -> 1
      end

    # This is the format that cytoscape.js expects.
    %{
      data: %{
        id: node.domain,
        label: node.domain,
        size: size,
        type: node.type,
        statusesPerDay: node.statuses_per_day
      },
      position: %{
        x: node.x,
        y: node.y
      }
    }
  end

  def render("edge.json", %{edge: edge}) do
    %{
      data: %{
        id: edge.id,
        source: edge.source_domain,
        target: edge.target_domain,
        weight: edge.weight
      }
    }
  end
end
