defmodule BackendWeb.InstanceController do
  use BackendWeb, :controller
  alias Backend.{Api, Instance, Repo}
  alias Graph.Cache
  import Ecto.Query

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
    instance = Cache.get_instance_with_relationships(domain)

    if instance == nil or instance.opt_out == true do
      send_resp(conn, 404, "Not found")
    else
      last_crawl = Cache.get_last_crawl(domain)

      restricted_domains =
        instance.federation_restrictions
        |> Enum.map(fn %{target_domain: domain} -> domain end)

      opted_out_instances =
        Instance
        |> select([i], i.domain)
        |> where([i], i.opt_out and i.domain in ^restricted_domains)
        |> Repo.all()

      # convert from a list of {domain, restriction_type} to a map of %{restriction_type => list_of_domains}
      federation_restrictions =
        instance.federation_restrictions
        |> Enum.filter(fn %{target_domain: domain} ->
          not Enum.member?(opted_out_instances, domain)
        end)
        |> Enum.reduce(%{}, fn %{target_domain: domain, type: type}, acc ->
          Map.update(acc, type, [domain], fn curr_domains -> [domain | curr_domains] end)
        end)
        |> Recase.Enumerable.convert_keys(&Recase.to_camel(&1))

      render(conn, "show.json",
        instance: instance,
        crawl: last_crawl,
        federation_restrictions: federation_restrictions
      )
    end
  end

  # def update(conn, %{"id" => id, "instance" => instance_params}) do
  #   instance = Api.get_instance!(id)

  #   with {:ok, %Instance{} = instance} <- Api.update_instance(instance, instance_params) do
  #     render(conn, "show.json", instance: instance)
  #   end
  # end
end
