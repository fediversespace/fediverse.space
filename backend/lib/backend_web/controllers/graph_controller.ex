defmodule BackendWeb.GraphController do
  use BackendWeb, :controller

  alias Backend.Api

  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    nodes = Api.list_nodes()
    edges = Api.list_edges()
    render(conn, "index.json", nodes: nodes, edges: edges)
  end
end
