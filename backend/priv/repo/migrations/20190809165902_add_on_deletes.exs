defmodule Backend.Repo.Migrations.AddOnDeletes do
  use Ecto.Migration

  def change do
    # Add ON DELETE CASCADE to foreign key relations.

    # crawls -> instances
    execute("ALTER TABLE crawls DROP CONSTRAINT crawls_instance_domain_fkey")

    execute(
      "ALTER TABLE crawls ADD CONSTRAINT crawls_instance_domain_fkey FOREIGN KEY (instance_domain) REFERENCES instances(domain) ON DELETE CASCADE"
    )

    # instance_peers -> instances
    execute("ALTER TABLE instance_peers DROP CONSTRAINT instance_peers_source_domain_fkey")

    execute(
      "ALTER TABLE instance_peers ADD CONSTRAINT instance_peers_source_domain_fkey FOREIGN KEY (source_domain) REFERENCES instances(domain) ON DELETE CASCADE"
    )

    execute("ALTER TABLE instance_peers DROP CONSTRAINT instance_peers_target_domain_fkey")

    execute(
      "ALTER TABLE instance_peers ADD CONSTRAINT instance_peers_target_domain_fkey FOREIGN KEY (target_domain) REFERENCES instances(domain) ON DELETE CASCADE"
    )

    # edges -> instances
    execute("ALTER TABLE edges DROP CONSTRAINT edges_source_domain_fkey")

    execute(
      "ALTER TABLE edges ADD CONSTRAINT edges_source_domain_fkey FOREIGN KEY (source_domain) REFERENCES instances(domain) ON DELETE CASCADE"
    )

    execute("ALTER TABLE edges DROP CONSTRAINT edges_target_domain_fkey")

    execute(
      "ALTER TABLE edges ADD CONSTRAINT edges_target_domain_fkey FOREIGN KEY (target_domain) REFERENCES instances(domain) ON DELETE CASCADE"
    )
  end
end
