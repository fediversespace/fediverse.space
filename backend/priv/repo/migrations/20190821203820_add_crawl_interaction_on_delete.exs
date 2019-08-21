defmodule Backend.Repo.Migrations.AddCrawlInteractionOnDelete do
  use Ecto.Migration

  def change do
    execute(
      "ALTER TABLE crawl_interactions DROP CONSTRAINT crawl_interactions_source_domain_fkey",
      "ALTER TABLE crawl_interactions ADD CONSTRAINT crawl_interactions_source_domain_fkey FOREIGN KEY (source_domain) REFERENCES instances(domain)"
    )

    execute(
      "ALTER TABLE crawl_interactions ADD CONSTRAINT crawl_interactions_source_domain_fkey FOREIGN KEY (source_domain) REFERENCES instances(domain) ON DELETE CASCADE",
      "ALTER TABLE crawl_interactions DROP CONSTRAINT crawl_interactions_source_domain_fkey"
    )

    execute(
      "ALTER TABLE crawl_interactions DROP CONSTRAINT crawl_interactions_target_domain_fkey",
      "ALTER TABLE crawl_interactions ADD CONSTRAINT crawl_interactions_target_domain_fkey FOREIGN KEY (target_domain) REFERENCES instances(domain)"
    )

    execute(
      "ALTER TABLE crawl_interactions ADD CONSTRAINT crawl_interactions_target_domain_fkey FOREIGN KEY (target_domain) REFERENCES instances(domain) ON DELETE CASCADE",
      "ALTER TABLE crawl_interactions DROP CONSTRAINT crawl_interactions_target_domain_fkey"
    )
  end
end
