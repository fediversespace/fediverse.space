defmodule Backend.Auth do
  @moduledoc """
  Functions related to authentication.
  """
  alias Phoenix.Token
  import Backend.Util

  @salt "fedi auth salt"

  def get_login_link(domain) do
    token = Token.sign(BackendWeb.Endpoint, @salt, domain)
    frontend_domain = get_config(:frontend_domain)
    "https://#{frontend_domain}/admin/verify?token=#{URI.encode(token)}"
  end

  def verify_token(token) do
    # tokens are valid for 12 hours
    Token.verify(BackendWeb.Endpoint, @salt, token, max_age: 43_200)
  end
end
