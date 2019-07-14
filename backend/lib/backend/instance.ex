defmodule Backend.Instance do
  use Ecto.Schema
  import Ecto.Changeset

  schema "instances" do
    field :domain, :string
    field :description, :string
    field :user_count, :integer
    field :status_count, :integer
    field :version, :string
    field :insularity, :float

    many_to_many :peers, Backend.Instance,
      join_through: Backend.InstancePeer,
      join_keys: [source_domain: :domain, target_domain: :domain]

    # This may look like it's duplicating :peers above, but it allows us to insert peer relationships quickly.
    # https://stackoverflow.com/a/56764241/3697202
    has_many :instance_peers, Backend.InstancePeer,
      foreign_key: :source_domain,
      references: :domain

    timestamps()
  end

  @doc false
  def changeset(instance, attrs) do
    instance
    |> cast(attrs, [
      :domain,
      :description,
      :user_count,
      :status_count,
      :version,
      :insularity,
      :updated_at
    ])
    |> validate_required([:domain])
    |> put_assoc(:peers, attrs.peers)
  end
end
