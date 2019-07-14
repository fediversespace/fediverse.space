defmodule Backend.Repo.Migrations.AddInstanceCoords do
  use Ecto.Migration

  def change do
    alter table(:instances) do
      add :x, :float
      add :y, :float
    end
  end
end
