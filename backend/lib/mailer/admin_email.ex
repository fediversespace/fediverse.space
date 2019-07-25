defmodule Backend.Mailer.AdminEmail do
  import Swoosh.Email
  import Backend.Util
  require Logger

  def send(subject, body) do
    admin_email = get_config(:admin_email)

    if admin_email != nil do
      new()
      |> to(admin_email)
      |> from("noreply@fediverse.space")
      |> subject(subject)
      |> text_body(body)
      |> Backend.Mailer.deliver!()
    else
      Logger.info("Could not send email to admin; not configured.")
    end
  end
end
