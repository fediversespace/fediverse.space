Mox.defmock(HttpMock, for: Backend.HttpBehaviour)
Application.put_env(:backend, :http, HttpMock)

ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Backend.Repo, :manual)
