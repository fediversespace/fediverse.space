defmodule BackendWeb.Router do
  use BackendWeb, :router
  import BackendWeb.RateLimiter

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:rate_limit, max_requests: 5, interval_seconds: 10) # requests to the same endpoint
  end

  pipeline :api_admin do
    plug(:rate_limit_authentication, max_requests: 5, interval_seconds: 60)
  end

  scope "/api", BackendWeb do
    pipe_through(:api)

    resources("/instances", InstanceController, only: [:index, :show])
    resources("/graph", GraphController, only: [:index, :show])
    resources("/search", SearchController, only: [:index])

    scope "/admin" do
      pipe_through :api_admin

      resources("/login", AdminLoginController, only: [:show, :create])
      get "/", AdminController, :show
      post "/", AdminController, :update
    end
  end
end
