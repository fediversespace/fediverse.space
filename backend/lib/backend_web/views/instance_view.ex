defmodule BackendWeb.InstanceView do
  use BackendWeb, :view
  alias BackendWeb.InstanceView
  import Backend.Util

  def render("show.json", %{instance: instance, crawl: crawl}) do
    user_threshold = get_config(:personal_instance_threshold)

    cond do
      instance.user_count < user_threshold and not instance.opt_in ->
        %{
          name: instance.domain,
          status: "personal instance"
        }

      instance.crawl_error == "robots.txt" ->
        %{
          name: instance.domain,
          status: instance.crawl_error
        }

      instance.crawl_error != nil and instance.type == nil ->
        %{
          name: instance.domain,
          status: instance.crawl_error
        }

      true ->
        last_updated = max_datetime(crawl.inserted_at, instance.updated_at)

        filtered_peers =
          instance.peers
          |> Enum.filter(fn peer -> not peer.opt_out end)

        statuses_per_user_per_day =
          if instance.statuses_per_day != nil and instance.user_count != nil and
               instance.user_count > 0 do
            instance.statuses_per_day / instance.user_count
          else
            nil
          end

        %{
          name: instance.domain,
          description: instance.description,
          version: instance.version,
          userCount: instance.user_count,
          insularity: instance.insularity,
          statusCount: instance.status_count,
          domainCount: length(instance.peers),
          peers: render_many(filtered_peers, InstanceView, "instance.json"),
          lastUpdated: last_updated,
          status: "success",
          type: instance.type,
          statusesPerDay: instance.statuses_per_day,
          statusesPerUserPerDay: statuses_per_user_per_day
        }
    end
  end

  def render("instance.json", %{instance: instance}) do
    %{name: instance.domain}
  end
end
