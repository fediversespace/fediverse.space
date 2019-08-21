defmodule Backend.CrawlInteraction do
  @moduledoc """
  Model for tracking interactions between instances. Stores the source and target instance, as well as the number
  of mentions seen in the given crawl.
  """
  use Ecto.Schema
  import Ecto.Changeset

  schema "crawl_interactions" do
    belongs_to :crawl, Backend.Crawl

    belongs_to :source, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :source_domain

    belongs_to :target, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :target_domain

    field :mentions, :integer

    timestamps()
  end

  @doc false
  def changeset(crawl_interaction, attrs) do
    crawl_interaction
    |> cast(attrs, [:crawl, :source, :target, :mentions])
    |> validate_required([:crawl, :source, :target, :mentions])
  end
end
