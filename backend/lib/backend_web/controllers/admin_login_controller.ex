defmodule BackendWeb.AdminLoginController do
  use BackendWeb, :controller
  import Backend.Util
  alias Backend.Api
  alias Backend.Mailer.UserEmail
  alias Mastodon.Messenger

  action_fallback BackendWeb.FallbackController

  @doc """
  Given an instance, looks up the login types (email or admin account) and returns them. The user can then
  choose one or the other by POSTing back.
  """
  def show(conn, %{"id" => domain}) do
    cleaned_domain = clean_domain(domain)
    instance = Api.get_instance(domain)

    keyword_args =
      cond do
        instance == nil or instance.type == nil ->
          [error: "We have not seen this instance before. Please check for typos."]

        not Enum.member?(["mastodon", "pleroma", "gab"], instance.type) ->
          [error: "It is only possible to administer Mastodon and Pleroma instances."]

        true ->
          case get_and_decode("https://#{cleaned_domain}/api/v1/instance") do
            {:ok, instance_data} ->
              [instance_data: instance_data, cleaned_domain: cleaned_domain]

            {:error, _err} ->
              [error: "Unable to get instance details. Is it currently live?"]
          end
      end

    render(conn, "show.json", keyword_args)
  end

  def create(conn, %{"domain" => domain, "type" => type}) do
    cleaned_domain = clean_domain(domain)
    {data_state, instance_data} = get_and_decode("https://#{cleaned_domain}/api/v1/instance")

    error =
      cond do
        data_state == :error ->
          "Unable to get instance details. Is it currently live?"

        type == "email" ->
          email = Map.get(instance_data, "email")

          case UserEmail.send_login_email(email, cleaned_domain) do
            {:ok, _} -> nil
            {:error, _} -> "Failed to send email."
          end

        type == "fediverseAccount" ->
          username = get_in(instance_data, ["contact_account", "username"])
          _status = Messenger.dm_login_link(username, cleaned_domain)
          nil

        true ->
          "Invalid account type. Must be 'email' or 'fediverseAccount'."
      end

    render(conn, "create.json", error: error)
  end
end
