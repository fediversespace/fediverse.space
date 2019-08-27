defmodule Backend.Repo.Migrations.CreateFederationRestrictions do
  use Ecto.Migration

  def change do
    create table(:federation_restrictions) do
      add :source_domain,
          references(:instances, column: :domain, type: :string, on_delete: :delete_all),
          null: false

      add :target_domain,
          references(:instances, column: :domain, type: :string, on_delete: :delete_all),
          null: false

      add :type, :string, null: false

      timestamps()
    end

    create index(:federation_restrictions, [:source_domain])
    create index(:federation_restrictions, [:target_domain])
  end
end
