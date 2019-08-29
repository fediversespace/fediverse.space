defmodule BackendWeb.InstanceView do
  use BackendWeb, :view
  alias BackendWeb.InstanceView
  import Backend.Util

  def render("index.json", %{
        instances: instances,
        total_pages: total_pages,
        page_number: page_number,
        total_entries: total_entries,
        page_size: page_size
      }) do
    %{
      instances: render_many(instances, InstanceView, "index_instance.json"),
      pageNumber: page_number,
      totalPages: total_pages,
      totalEntries: total_entries,
      pageSize: page_size
    }
  end

  @doc """
  Used when rendering the index of all instances (the different from show.json is primarily that it does not
  include peers).
  """
  def render("index_instance.json", %{instance: instance}) do
    %{
      name: instance.domain,
      description: instance.description,
      version: instance.version,
      userCount: instance.user_count,
      insularity: instance.insularity,
      statusCount: instance.status_count,
      type: instance.type,
      statusesPerDay: instance.statuses_per_day,
      statusesPerUserPerDay: get_statuses_per_user_per_day(instance)
    }
  end

  def render("show.json", %{instance: instance, crawl: crawl}) do
    user_threshold = get_config(:personal_instance_threshold)

    cond do
      instance.user_count < user_threshold and not instance.opt_in ->
        render_personal_instance(instance)

      instance.crawl_error == "robots.txt" ->
        render_domain_and_error(instance)

      instance.crawl_error != nil and instance.type == nil ->
        render_domain_and_error(instance)

      true ->
        render_instance(instance, crawl)
    end
  end

  def render("peer.json", %{instance: instance}) do
    %{name: instance.domain}
  end

  defp render_personal_instance(instance) do
    %{
      name: instance.domain,
      status: "personal instance"
    }
  end

  defp render_domain_and_error(instance) do
    %{
      name: instance.domain,
      status: instance.crawl_error
    }
  end

  defp render_instance(instance, crawl) do
    last_updated = max_datetime(crawl.inserted_at, instance.updated_at)

    filtered_peers =
      instance.peers
      |> Enum.filter(fn peer -> not peer.opt_out end)

    federation_restrictions =
      instance.federation_restrictions
      |> Enum.reduce(%{}, fn %{target_domain: domain, type: type}, acc ->
        Map.update(acc, type, [domain], fn curr_domains -> [domain | curr_domains] end)
      end)
      |> Recase.Enumerable.convert_keys(&Recase.to_camel(&1))

    %{
      name: instance.domain,
      description: instance.description,
      version: instance.version,
      userCount: instance.user_count,
      insularity: instance.insularity,
      statusCount: instance.status_count,
      domainCount: length(instance.peers),
      peers: render_many(filtered_peers, InstanceView, "peer.json"),
      federationRestrictions: federation_restrictions,
      lastUpdated: last_updated,
      status: "success",
      type: instance.type,
      statusesPerDay: instance.statuses_per_day,
      statusesPerUserPerDay: get_statuses_per_user_per_day(instance)
    }
  end

  defp get_statuses_per_user_per_day(instance) do
    if instance.statuses_per_day != nil and instance.user_count != nil and
         instance.user_count > 0 do
      instance.statuses_per_day / instance.user_count
    else
      nil
    end
  end
end
