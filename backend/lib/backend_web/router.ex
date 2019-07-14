defmodule BackendWeb.Router do
  use BackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", BackendWeb do
    pipe_through :api

    resources "/instances", InstanceController, only: [:index, :show]
    resources "/graph", GraphController, only: [:index]
  end
end
