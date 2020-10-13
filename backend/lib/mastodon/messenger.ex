defmodule Mastodon.Messenger do
  @moduledoc """
  Module for interacting with a Mastodon account. In our case, it's only used to DM login links.
  """
  import Backend.{Auth, Util}
  require Logger

  def dm_login_link(username, user_domain) do
    mastodon_domain = Application.get_env(:backend, __MODULE__)[:domain]
    token = Application.get_env(:backend, __MODULE__)[:token]
    frontend_domain = get_config(:frontend_domain)

    conn = Hunter.new(base_url: "https://#{mastodon_domain}", bearer_token: token)
    Logger.info(inspect(conn))

    status_text =
      "@#{username}@#{user_domain} " <>
        "Someone tried to log in to #{user_domain} on https://#{frontend_domain}.\n" <>
        "If it was you, click here to confirm:\n" <>
        "#{get_login_link(user_domain)} " <>
        "This link will be valid for 12 hours."

    Hunter.Status.create_status(conn, status_text, visibility: :direct)
  end
end
