defmodule BackendWeb.AdminView do
  use BackendWeb, :view
  require Logger

  def render("show.json", %{instance: instance}) do
    %{
      domain: domain,
      opt_in: opt_in,
      opt_out: opt_out,
      user_count: user_count,
      status_count: status_count
    } = instance

    %{
      domain: domain,
      optIn: opt_in,
      optOut: opt_out,
      userCount: user_count,
      statusCount: status_count
    }
  end
end
