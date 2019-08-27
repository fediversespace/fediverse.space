defmodule Backend.FederationRestriction do
  @moduledoc false
  use Ecto.Schema
  import Ecto.Changeset

  schema "federation_restrictions" do
    belongs_to :source, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :source_domain

    belongs_to :target, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :target_domain

    field :type, :string

    timestamps()
  end

  @doc false
  def changeset(federation_restriction, attrs) do
    federation_restriction
    |> cast(attrs, [:source, :target, :type])
    |> validate_required([:source, :target, :type])
  end
end
