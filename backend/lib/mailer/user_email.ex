defmodule Backend.Mailer.UserEmail do
  @moduledoc """
  Module for sending emails to users.
  """
  import Swoosh.Email
  import Backend.{Auth, Util}
  require Logger

  @spec send_login_email(String.t(), String.t()) :: {:ok | :error, term}
  def send_login_email(address, domain) do
    frontend_domain = get_config(:frontend_domain)

    body =
      "Someone tried to log in to #{domain} on https://#{frontend_domain}.\n\nIf it was you, click here to confirm:\n\n" <>
        get_login_link(domain)

    new()
    |> to(address)
    |> from("noreply@fediverse.space")
    |> subject("Login to fediverse.space")
    |> text_body(body)
    |> Backend.Mailer.deliver()
  end
end
