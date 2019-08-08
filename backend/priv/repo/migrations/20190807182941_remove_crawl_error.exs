defmodule Backend.Repo.Migrations.RemoveCrawlError do
  use Ecto.Migration

  def change do
    execute("ALTER TABLE crawls DISABLE TRIGGER ALL", "ALTER TABLE crawls ENABLE TRIGGER ALL")
    execute("DELETE FROM crawls WHERE error IS NOT NULL", "")
    execute("ALTER TABLE crawls ENABLE TRIGGER ALL", "")

    alter table(:crawls) do
      remove :error, :string
    end

    alter table(:instances) do
      add :crawl_error, :string
      add :crawl_error_count, :integer, default: 0, null: false
    end
  end
end
