defmodule BackendWeb.AdminController do
  use BackendWeb, :controller
  alias Backend.{Auth, Api, Instance}
  require Logger

  action_fallback BackendWeb.FallbackController

  def show(conn, _params) do
    [token] = get_req_header(conn, "token")

    with {:ok, domain} <- Auth.verify_token(token) do
      instance = Api.get_instance!(domain)
      render(conn, "show.json", instance: instance)
    end
  end

  def update(conn, params) do
    [token] = get_req_header(conn, "token")

    with {:ok, domain} <- Auth.verify_token(token) do
      %{"optIn" => opt_in, "optOut" => opt_out} = params

      instance = %Instance{
        domain: domain,
        opt_in: opt_in,
        opt_out: opt_out
      }

      with {:ok, updated_instance} <- Api.update_instance(instance) do
        render(conn, "show.json", instance: updated_instance)
      end
    end
  end
end
