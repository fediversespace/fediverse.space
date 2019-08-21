defmodule BackendWeb.AdminLoginController do
  use BackendWeb, :controller
  import Backend.Util
  alias Backend.Mailer.UserEmail

  action_fallback BackendWeb.FallbackController

  @doc """
  Given an instance, looks up the login types (email or admin account) and returns them. The user can then
  choose one or the other by POSTing back.
  """
  def show(conn, %{"id" => domain}) do
    cleaned_domain = clean_domain(domain)

    instance_data = get_and_decode!("https://#{cleaned_domain}/api/v1/instance")

    render(conn, "show.json", instance_data: instance_data, cleaned_domain: cleaned_domain)
  end

  def create(conn, %{"domain" => domain, "type" => type}) do
    cleaned_domain = clean_domain(domain)

    instance_data = get_and_decode!("https://#{cleaned_domain}/api/v1/instance")

    # credo:disable-for-lines:16 Credo.Check.Refactor.CondStatements
    error =
      cond do
        type == "email" ->
          email = Map.get(instance_data, "email")

          case UserEmail.send_login_email(email, cleaned_domain) do
            {:ok, _} -> nil
            {:error, _} -> "Failed to send email."
          end

        # type == "fediverseAccount" ->
        #   account = nil

        true ->
          "Invalid account type. Must be 'email' or 'fediverseAccount'."
      end

    render(conn, "create.json", error: error)
  end
end
