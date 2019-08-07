defmodule Backend.Crawl do
  use Ecto.Schema
  import Ecto.Changeset

  schema "crawls" do
    belongs_to :instance, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :instance_domain

    field :interactions_seen, :integer
    field :statuses_seen, :integer

    timestamps()
  end

  @doc false
  def changeset(crawl, attrs) do
    crawl
    |> cast(attrs, [:instance, :statuses_seen, :interactions_seen])
    |> validate_required([:instance])
  end
end
