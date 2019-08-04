defmodule BackendWeb.SearchController do
  use BackendWeb, :controller
  alias Backend.Api

  action_fallback(BackendWeb.FallbackController)

  def index(conn, params) do
    query = Map.get(params, "query")
    from = Map.get(params, "after", "0") |> String.to_integer()

    # Filters
    filter_keys =
      params
      |> Map.keys()
      |> Enum.filter(fn key -> key !== "query" and key !== "after" end)

    filters =
      params
      |> Map.take(filter_keys)
      |> Map.to_list()
      |> Enum.map(&convert_to_es_filter(&1))

    %{hits: hits, next: next} = Api.search_instances(query, filters, from)
    render(conn, "index.json", hits: hits, next: next)
  end

  defp convert_to_es_filter(url_param) do
    {key, value} = url_param
    # Key has the form e.g. "type_eq" or "user_count_gte"
    key_components = String.split(key, "_")
    # The field to filter on
    field = Enum.take(key_components, length(key_components) - 1) |> Enum.join("_")
    # The filter relation -- one of eq, gt, gte, lt, lte
    relation = Enum.take(key_components, -1)

    case field do
      "type" ->
        %{
          "term" => %{"type" => value}
        }

      "user_count" ->
        %{
          "range" => %{
            "user_count" => %{
              relation => value
            }
          }
        }
    end
  end
end
