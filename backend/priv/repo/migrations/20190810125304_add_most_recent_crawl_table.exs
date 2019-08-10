defmodule Backend.Repo.Migrations.AddMostRecentCrawlTable do
  use Ecto.Migration

  def change do
    create table(:most_recent_crawl) do
      add :instance_domain, references(:instances, column: :domain, type: :string)
      add :crawl_id, references(:crawls)

      timestamps()
    end

    create unique_index(:most_recent_crawl, [:instance_domain])

    flush()

    execute(
      "
    INSERT INTO most_recent_crawl (instance_domain, crawl_id, updated_at, inserted_at)
    SELECT
      c.instance_domain,
      MAX(c.id) AS crawl_id,
      (SELECT NOW()) AS updated_at,
      (SELECT NOW()) AS inserted_at
    FROM
      crawls c
    GROUP BY
      c.instance_domain
    ",
      "DELETE FROM most_recent_crawl"
    )
  end
end
