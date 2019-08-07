defmodule Backend.Repo.Migrations.CreateCrawls do
  use Ecto.Migration

  def change do
    create table(:crawls) do
      add :instance_domain, references(:instances, column: :domain, type: :string), null: false

      add :statuses_seen, :integer
      add :interactions_seen, :integer

      add :error, :text

      timestamps()
    end

    create index(:crawls, [:error])
    create index(:crawls, [:inserted_at])
  end
end
