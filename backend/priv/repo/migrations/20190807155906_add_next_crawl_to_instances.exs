defmodule Backend.Repo.Migrations.AddNextCrawlToInstances do
  use Ecto.Migration

  def change do
    alter table(:instances) do
      add :next_crawl, :naive_datetime
    end

    create index(:instances, [:next_crawl])
  end
end
