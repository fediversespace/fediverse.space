defmodule Backend.Repo.Migrations.AddBaseDomain do
  use Ecto.Migration

  def change do
    alter table(:instances) do
      add :base_domain, :string
    end

    create index(:instances, [:base_domain])
  end
end
