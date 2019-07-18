defmodule Backend.Repo.Migrations.CreateEdges do
  use Ecto.Migration

  def change do
    create table(:edges) do
      add :source_domain, references(:instances, column: :domain, type: :string), null: false
      add :target_domain, references(:instances, column: :domain, type: :string), null: false

      add :weight, :float, null: false

      timestamps()
    end

    create index(:edges, [:source_domain])
    create index(:edges, [:target_domain])
  end
end
