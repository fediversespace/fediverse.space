defmodule BackendWeb.SearchView do
  use BackendWeb, :view
  alias BackendWeb.SearchView
  require Logger

  def render("index.json", %{instances: instances, next: next}) do
    %{
      results: render_many(instances, SearchView, "instance.json", as: :instance),
      next: next
    }
  end

  def render("instance.json", %{instance: instance}) do
    %{
      name: instance.domain,
      description: instance.description,
      userCount: instance.user_count
    }
  end
end
