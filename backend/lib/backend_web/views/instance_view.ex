defmodule BackendWeb.InstanceView do
  use BackendWeb, :view
  alias BackendWeb.InstanceView
  import Backend.Util
  require Logger

  def render("index.json", %{instances: instances}) do
    render_many(instances, InstanceView, "instance.json")
  end

  def render("show.json", %{instance: instance, crawl: crawl}) do
    render_one(instance, InstanceView, "instance_detail.json", crawl: crawl)
  end

  def render("instance.json", %{instance: instance}) do
    %{name: instance.domain}
  end

  def render("instance_detail.json", %{instance: instance, crawl: crawl}) do
    user_threshold = get_config(:personal_instance_threshold)

    [status, last_updated] =
      case crawl do
        nil ->
          ["not crawled", nil]

        _ ->
          case crawl.error do
            nil -> ["success", crawl.inserted_at]
            err -> [err, crawl.inserted_at]
          end
      end

    cond do
      instance.user_count < user_threshold ->
        %{
          name: instance.domain,
          status: "personal instance"
        }

      true ->
        %{
          name: instance.domain,
          description: instance.description,
          version: instance.version,
          userCount: instance.user_count,
          insularity: instance.insularity,
          statusCount: instance.status_count,
          domainCount: length(instance.peers),
          peers: render_many(instance.peers, InstanceView, "instance.json"),
          lastUpdated: last_updated,
          status: status,
          type: instance.type
        }
    end
  end
end
