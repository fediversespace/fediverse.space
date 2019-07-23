defmodule BackendWeb.SearchView do
  use BackendWeb, :view
  alias BackendWeb.SearchView
  import Backend.Util

  def render("index.json", %{instances: instances, next: next}) do
    %{
      results: render_many(instances, SearchView, "instance.json", as: :instance),
      next: next
    }
  end

  def render("instance.json", %{instance: instance}) do
    threshold = get_config(:personal_instance_threshold)

    description =
      if instance.user_count != nil and instance.user_count < threshold do
        nil
      else
        instance.description
      end

    %{
      name: instance.domain,
      description: description,
      userCount: instance.user_count
    }
  end
end
