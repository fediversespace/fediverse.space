defmodule BackendWeb.SearchController do
  use BackendWeb, :controller
  alias Backend.Api

  action_fallback(BackendWeb.FallbackController)

  def index(conn, params) do
    query = Map.get(params, "query")
    cursor_after = Map.get(params, "after", nil)
    %{instances: instances, next: next} = Api.search_instances(query, cursor_after)
    render(conn, "index.json", instances: instances, next: next)
  end
end
