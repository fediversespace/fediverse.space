defmodule BackendWeb.GraphController do
  use BackendWeb, :controller
  alias Graph.Cache

  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    %{nodes: nodes, edges: edges} = Cache.get_graph()
    render(conn, "index.json", nodes: nodes, edges: edges)
  end

  def show(conn, %{"id" => domain}) do
    %{nodes: nodes, edges: edges} = Cache.get_graph(domain)
    render(conn, "index.json", nodes: nodes, edges: edges)
  end
end
