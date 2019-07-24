defmodule Backend.Repo.Migrations.AddInstanceType do
  use Ecto.Migration

  def change do
    alter table(:instances) do
      add :type, :string
    end
  end
end
