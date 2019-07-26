defmodule BackendWeb.SearchView do
  use BackendWeb, :view
  alias BackendWeb.SearchView
  import Backend.Util

  def render("index.json", %{hits: hits, next: next}) do
    %{
      results: render_many(hits, SearchView, "instance.json", as: :hit),
      next: next
    }
  end

  def render("instance.json", %{hit: hit}) do
    threshold = get_config(:personal_instance_threshold)

    description =
      if hit.user_count != nil and hit.user_count < threshold do
        nil
      else
        hit.description
      end

    %{
      name: hit.domain,
      description: description,
      userCount: hit.user_count,
      type: hit.type
    }
  end
end
