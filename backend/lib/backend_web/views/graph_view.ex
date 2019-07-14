defmodule BackendWeb.GraphView do
  use BackendWeb, :view
  alias BackendWeb.GraphView

  def render("index.json", %{nodes: nodes, edges: edges}) do
    %{
      nodes: render_many(nodes, GraphView, "node.json"),
      edges: render_many(edges, GraphView, "edge.json")
    }
  end

  def render("node.json", %{graph: node}) do
    size =
      case node.user_count > 1 do
        true -> :math.log(node.user_count)
        false -> 1
      end

    %{
      id: node.domain,
      label: node.domain,
      size: size,
      x: node.x,
      y: node.y
    }
  end

  def render("edge.json", %{graph: edge}) do
    %{
      id: edge.id,
      source: edge.source_domain,
      target: edge.target_domain,
      size: edge.weight
    }
  end
end
