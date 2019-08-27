defmodule BackendWeb.InstanceController do
  use BackendWeb, :controller
  alias Backend.Api
  alias Graph.Cache

  action_fallback(BackendWeb.FallbackController)

  def index(conn, params) do
    page = Map.get(params, "page")

    %{
      entries: instances,
      total_pages: total_pages,
      page_number: page_number,
      total_entries: total_entries,
      page_size: page_size
    } = Api.get_instances(page)

    render(conn, "index.json",
      instances: instances,
      total_pages: total_pages,
      page_number: page_number,
      total_entries: total_entries,
      page_size: page_size
    )
  end

  def show(conn, %{"id" => domain}) do
    instance = Cache.get_instance_with_peers(domain)

    if instance == nil or instance.opt_out == true do
      send_resp(conn, 404, "Not found")
    else
      last_crawl = Cache.get_last_crawl(domain)
      render(conn, "show.json", instance: instance, crawl: last_crawl)
    end
  end

  # def update(conn, %{"id" => id, "instance" => instance_params}) do
  #   instance = Api.get_instance!(id)

  #   with {:ok, %Instance{} = instance} <- Api.update_instance(instance, instance_params) do
  #     render(conn, "show.json", instance: instance)
  #   end
  # end
end
