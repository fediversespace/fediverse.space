defmodule Backend.Repo.Migrations.AddStatusesPerHour do
  use Ecto.Migration

  def change do
    alter table(:instances) do
      add :statuses_per_day, :float
    end
  end
end
