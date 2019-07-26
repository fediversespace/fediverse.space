defmodule BackendWeb.AdminLoginView do
  use BackendWeb, :view
  import Backend.Util

  def render("show.json", %{instance_data: instance_data, cleaned_domain: cleaned_domain}) do
    username = get_in(instance_data, ["contact_account", "username"])

    fedi_account = get_account(username, cleaned_domain)

    %{
      domain: cleaned_domain,
      email: Map.get(instance_data, "email"),
      fediverseAccount: fedi_account
    }
  end

  def render("create.json", %{error: error}) do
    if error != nil do
      %{
        error: error
      }
    else
      %{
        data: "success"
      }
    end
  end
end
