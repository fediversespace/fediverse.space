defmodule Backend.Scheduler do
  @moduledoc """
  This module runs recurring tasks.
  """

  use Quantum.Scheduler, otp_app: :backend

  alias Backend.{Crawl, Edge, Interaction, Instance, Repo}
  import Ecto.Query
  require Logger

  @doc """
  Prunes all crawls that are more than `integer` `unit`s old.
  For example, to delete crawls older than one month, call `prune(1, "month")`.

  `unit` must singular, e.g. "second", "minute", "hour", "month", "year", etc...
  """
  @spec prune_crawls(integer, String.t()) :: any
  def prune_crawls(amount, unit) do
    {deleted_num, _} =
      Crawl
      |> where(
        [i],
        i.inserted_at <
          datetime_add(^NaiveDateTime.utc_now(), -1 * ^amount, ^unit)
      )
      |> Repo.delete_all()

    Logger.info("Pruned #{deleted_num} old crawls.")
  end

  @doc """
  This function aggregates statistics from the interactions in the database.
  It calculates the strength of edges between nodes.

  TODO: generate edge weights. The weight of an edge between two instances will be
  (number of mentions of each other) / (total number of statuses crawled).
  This requires us to keep track of how many statuses we've seen.
  """
  def generate_edges() do
    interactions =
      Interaction
      |> select([inter], {inter.source_domain, inter.target_domain})
      |> join(:left, [inter], i_source in Instance, on: inter.source_domain == i_source.domain)
      |> join(:left, [inter], i_target in Instance, on: inter.target_domain == i_target.domain)
      |> where(
        [inter, i_source, i_target],
        not is_nil(i_source.last_crawl_timestamp) and not is_nil(i_target.last_crawl_timestamp)
      )
      # Repo.all() returns a tuple like {"mastodon.social", "cursed.technology"}
      |> Repo.all()
      # Create a map of %{source_domain => [target_domains]}
      |> Enum.group_by(fn tuple -> Kernel.elem(tuple, 0) end, fn tuple ->
        Kernel.elem(tuple, 1)
      end)

    # Calculate insularity score
    Repo.transaction(fn ->
      interactions
      |> Enum.each(fn {source, targets} ->
        total_mentions = length(targets)
        self_mentions = Enum.count(targets, fn t -> t == source end)

        insularity = self_mentions / total_mentions

        Repo.insert!(
          %Instance{
            domain: source,
            insularity: insularity
          },
          on_conflict: [set: [insularity: insularity]],
          conflict_target: :domain
        )
      end)

      # Get edges
      edges = MapSet.new()

      interactions
      |> Enum.each(fn {source, targets} ->
        targets
        |> Enum.each(fn target ->
          [key_a, key_b] = Enum.sort([source, target])

          edge = %Edge{
            source_domain: key_a,
            target_domain: key_b
          }

          MapSet.put(edges, edge)
          Logger.debug(inspect(edges))
        end)
      end)

      Logger.debug(inspect(edges))

      now = NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)

      Repo.delete_all(Edge)

      edges =
        edges
        |> MapSet.to_list()
        |> Enum.map(fn %{source_domain: source_domain, target_domain: target_domain} ->
          %Edge{
            source_domain: source_domain,
            target_domain: target_domain,
            updated_at: now,
            inserted_at: now
          }
        end)

      Repo.insert_all(Edge, edges)
    end)
  end
end
