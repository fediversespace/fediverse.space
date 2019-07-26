defmodule BackendWeb.SearchController do
  use BackendWeb, :controller
  alias Backend.Api

  action_fallback(BackendWeb.FallbackController)

  def index(conn, params) do
    query = Map.get(params, "query")
    from = Map.get(params, "after", "0") |> String.to_integer()
    %{hits: hits, next: next} = Api.search_instances(query, from)
    render(conn, "index.json", hits: hits, next: next)
  end
end
