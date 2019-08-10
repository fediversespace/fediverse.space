defmodule Backend.Repo.Migrations.AddCrawlsIndex do
  use Ecto.Migration

  def change do
    create index(:crawls, [:instance_domain])
    create index(:crawl_interactions, [:source_domain])
    create index(:crawl_interactions, [:target_domain])
  end
end
