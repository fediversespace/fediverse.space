defmodule BackendWeb.InstanceController do
  use BackendWeb, :controller

  import Backend.Util
  alias Backend.Api

  action_fallback(BackendWeb.FallbackController)

  def index(conn, _params) do
    instances = Api.list_instances()
    render(conn, "index.json", instances: instances)
  end

  def show(conn, %{"id" => domain}) do
    instance = Api.get_instance!(domain)
    last_crawl = get_last_successful_crawl(domain)
    render(conn, "show.json", instance: instance, crawl: last_crawl)
  end

  # def update(conn, %{"id" => id, "instance" => instance_params}) do
  #   instance = Api.get_instance!(id)

  #   with {:ok, %Instance{} = instance} <- Api.update_instance(instance, instance_params) do
  #     render(conn, "show.json", instance: instance)
  #   end
  # end
end
