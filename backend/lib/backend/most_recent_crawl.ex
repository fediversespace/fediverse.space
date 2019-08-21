defmodule Backend.MostRecentCrawl do
  @moduledoc """
  Model for fast access to the most recent crawl ID for a given domain.
  You could also just look this up in the crawls table, but that table gets very large so this is much faster.
  """
  use Ecto.Schema
  import Ecto.Changeset

  schema "most_recent_crawl" do
    belongs_to :instance, Backend.Instance,
      references: :domain,
      type: :string,
      foreign_key: :instance_domain

    belongs_to :crawl, Backend.Crawl

    timestamps()
  end

  @doc false
  def changeset(edge, attrs) do
    edge
    |> cast(attrs, [:instance, :crawl])
    |> validate_required([:instance, :crawl])
  end
end
