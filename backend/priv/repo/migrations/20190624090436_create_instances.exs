defmodule Backend.Repo.Migrations.CreateInstances do
  use Ecto.Migration

  def change do
    create table(:instances) do
      add :domain, :string, null: false
      add :description, :text
      add :user_count, :integer
      add :status_count, :integer
      add :version, :string
      add :insularity, :float

      add :x, :float
      add :y, :float

      timestamps()
    end

    create unique_index(:instances, [:domain])

    create table(:instance_peers) do
      add :source_domain, references(:instances, column: :domain, type: :string)
      add :target_domain, references(:instances, column: :domain, type: :string)

      timestamps()
    end

    create unique_index(:instance_peers, [:source_domain, :target_domain])
  end
end
