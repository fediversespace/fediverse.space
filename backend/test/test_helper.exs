Mox.defmock(HttpMock, for: Backend.HttpBehaviour)
Application.put_env(:backend, :http, HttpMock)

ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Backend.Repo, :manual)

defmodule TestHelpers do
  @spec load_json(String.t()) :: any()
  def load_json(path) do
    Path.join([__DIR__, "support", "data", "json", path])
    |> File.read!()
    |> Jason.decode!()
  end
end
