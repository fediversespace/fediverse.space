defmodule Backend.InstancePeer do
  use Ecto.Schema
  import Ecto.Changeset

  schema "instance_peers" do
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
  def changeset(instance_peer, attrs) do
    instance_peer
    |> cast(attrs, [])
    |> validate_required([])
  end
end
