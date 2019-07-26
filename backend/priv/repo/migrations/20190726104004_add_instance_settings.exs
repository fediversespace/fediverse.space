defmodule Backend.Repo.Migrations.AddInstanceSettings do
  use Ecto.Migration

  def change do
    alter table(:instances) do
      add :opt_in, :boolean, default: false, null: false
      add :opt_out, :boolean, default: false, null: false
    end

    create index(:instances, [:opt_out])
  end
end
