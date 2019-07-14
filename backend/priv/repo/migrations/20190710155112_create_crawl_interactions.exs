defmodule Backend.Repo.Migrations.CreateCrawlInteractions do
  use Ecto.Migration

  def change do
    create table(:crawl_interactions) do
      add :crawl_id, references(:crawls, on_delete: :delete_all), null: false

      add :source_domain, references(:instances, column: :domain, type: :string), null: false
      add :target_domain, references(:instances, column: :domain, type: :string), null: false

      add :mentions, :integer

      timestamps()
    end
  end
end
