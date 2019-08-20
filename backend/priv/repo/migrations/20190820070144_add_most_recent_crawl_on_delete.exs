defmodule Backend.Repo.Migrations.AddMostRecentCrawlOnDelete do
  use Ecto.Migration

  def change do
    execute(
      "ALTER TABLE most_recent_crawl DROP CONSTRAINT most_recent_crawl_crawl_id_fkey",
      "ALTER TABLE most_recent_crawl ADD CONSTRAINT most_recent_crawl_crawl_id_fkey FOREIGN KEY (crawl_id) REFERENCES crawls(id)"
    )

    execute(
      "ALTER TABLE most_recent_crawl ADD CONSTRAINT most_recent_crawl_crawl_id_fkey FOREIGN KEY (crawl_id) REFERENCES crawls(id) ON DELETE CASCADE",
      "ALTER TABLE most_recent_crawl DROP CONSTRAINT most_recent_crawl_crawl_id_fkey"
    )

    execute(
      "ALTER TABLE most_recent_crawl DROP CONSTRAINT most_recent_crawl_instance_domain_fkey",
      "ALTER TABLE most_recent_crawl ADD CONSTRAINT most_recent_crawl_instance_domain_fkey FOREIGN KEY (instance_domain) REFERENCES instances(domain)"
    )

    execute(
      "ALTER TABLE most_recent_crawl ADD CONSTRAINT most_recent_crawl_instance_domain_fkey FOREIGN KEY (instance_domain) REFERENCES instances(domain) ON DELETE CASCADE",
      "ALTER TABLE most_recent_crawl DROP CONSTRAINT most_recent_crawl_instance_domain_fkey"
    )
  end
end
