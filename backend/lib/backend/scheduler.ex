defmodule Backend.Scheduler do
  @moduledoc """
  This module runs recurring tasks.
  """

  use Quantum.Scheduler, otp_app: :backend

  alias Backend.{Crawl, Edge, CrawlInteraction, Instance, Repo}
  import Backend.Util
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
  Calculates every instance's "insularity score" -- that is, the percentage of mentions that are among users on the
  instance, rather than at other instances.
  """
  def generate_insularity_scores() do
    now = get_now()

    crawls_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        interactions_seen: sum(c.interactions_seen)
      })
      |> where([c], is_nil(c.error))
      |> group_by([c], c.instance_domain)

    scores =
      CrawlInteraction
      |> join(:left, [ci], c in subquery(crawls_subquery),
        on: ci.source_domain == c.instance_domain
      )
      |> where([ci], ci.source_domain == ci.target_domain)
      |> group_by([ci], ci.source_domain)
      |> select([ci, c], %{
        domain: ci.source_domain,
        mentions: sum(ci.mentions),
        # we can take min() because every row is the same
        interactions: min(c.interactions_seen)
      })
      |> Repo.all()
      |> (fn o ->
            Logger.info(inspect(o))
            o
          end).()
      |> Enum.map(fn %{domain: domain, mentions: mentions, interactions: interactions} ->
        %{
          domain: domain,
          insularity: mentions / interactions,
          inserted_at: now,
          updated_at: now
        }
      end)

    Instance
    |> Repo.insert_all(scores,
      on_conflict: {:replace, [:insularity, :updated_at]},
      conflict_target: :domain
    )
  end

  @doc """
  This function aggregates statistics from the interactions in the database.
  It calculates the strength of edges between nodes.
  """
  def generate_edges() do
    now = get_now()

    crawls_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        statuses_seen: sum(c.statuses_seen)
      })
      |> where([c], is_nil(c.error))
      |> group_by([c], c.instance_domain)

    interactions =
      CrawlInteraction
      |> join(:left, [ci], c_source in subquery(crawls_subquery),
        on: ci.source_domain == c_source.instance_domain
      )
      |> join(:left, [ci], c_target in subquery(crawls_subquery),
        on: ci.target_domain == c_target.instance_domain
      )
      |> group_by([ci], [ci.source_domain, ci.target_domain])
      |> select([ci, c_source, c_target], %{
        source_domain: ci.source_domain,
        target_domain: ci.target_domain,
        mentions: sum(ci.mentions),
        # we can take min() because every row is the same
        source_statuses_seen: min(c_source.statuses_seen),
        target_statuses_seen: min(c_target.statuses_seen)
      })
      |> Repo.all()

    # Get edges and their weights
    Repo.transaction(fn ->
      Edge
      |> Repo.delete_all()

      edges =
        interactions
        # Get a map of %{{source, target} => {total_mention_count, total_statuses_seen}}
        |> Enum.reduce(%{}, fn
          %{
            source_domain: source_domain,
            target_domain: target_domain,
            mentions: mentions,
            source_statuses_seen: source_statuses_seen,
            target_statuses_seen: target_statuses_seen
          } = x,
          acc ->
            Logger.info(inspect(x))
            key = get_interaction_key(source_domain, target_domain)

            # target_statuses_seen might be nil if that instance was never crawled. default to 0.
            target_statuses_seen =
              case target_statuses_seen do
                nil -> 0
                _ -> target_statuses_seen
              end

            statuses_seen = source_statuses_seen + target_statuses_seen

            Map.update(acc, key, {mentions, statuses_seen}, fn {curr_mentions, curr_statuses_seen} ->
              {curr_mentions + mentions, curr_statuses_seen}
            end)
        end)
        |> Enum.map(fn {{source_domain, target_domain}, {mention_count, statuses_seen}} ->
          %{
            source_domain: source_domain,
            target_domain: target_domain,
            weight: mention_count / statuses_seen,
            inserted_at: now,
            updated_at: now
          }
        end)

      Edge
      |> Repo.insert_all(edges)
    end)
  end
end
