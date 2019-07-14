defmodule Backend.Edge do
  use Ecto.Schema
  import Ecto.Changeset

  schema "edges" do
    belongs_to :source, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :source_domain

    belongs_to :target, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :target_domain

    timestamps()
  end

  @doc false
  def changeset(edge, attrs) do
    edge
    |> cast(attrs, [:source, :target])
    |> validate_required([:source, :target])
  end
end
