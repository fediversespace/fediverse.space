defmodule Backend.Elasticsearch.Cluster do
  use Elasticsearch.Cluster, otp_app: :backend

  def init(config) do
    indexes = %{
      instances: %{
        settings: Application.app_dir(:backend, "priv/elasticsearch/instances.json"),
        store: Backend.Elasticsearch.Store,
        sources: [Backend.Instance],
        bulk_page_size: 1000,
        bulk_wait_interval: 1000
      }
    }

    config =
      config
      |> Map.put(:indexes, indexes)

    {:ok, config}
  end
end
