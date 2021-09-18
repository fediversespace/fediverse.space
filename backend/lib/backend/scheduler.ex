defmodule Backend.Scheduler do
  @moduledoc """
  This module runs recurring tasks.
  """

  use Quantum, otp_app: :backend

  alias Backend.{Crawl, CrawlInteraction, Edge, FederationRestriction, Instance, Repo}
  alias Backend.Mailer.AdminEmail

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
      |> Repo.delete_all(timeout: :infinity)

    Logger.info("Pruned #{deleted_num} old crawls.")
  end

  @doc """
  Calculates every instance's "insularity score" -- that is, the percentage of mentions that are among users on the
  instance, rather than at other instances.
  """
  def generate_insularity_scores do
    now = get_now()

    crawls_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        statuses_seen: sum(c.statuses_seen),
        interactions_seen: sum(c.interactions_seen)
      })
      |> group_by([c], c.instance_domain)

    self_mentions_subquery =
      CrawlInteraction
      |> where([ci], ci.source_domain == ci.target_domain)
      |> select([ci], %{
        domain: ci.source_domain,
        self_mentions: sum(ci.mentions)
      })
      |> group_by([ci], ci.source_domain)

    scores =
      Instance
      |> join(:inner, [i], c in subquery(crawls_subquery), on: i.domain == c.instance_domain)
      |> join(:left, [i, c], ci in subquery(self_mentions_subquery), on: i.domain == ci.domain)
      # don't generate insularity scores for instances where we haven't seen any activity
      # (e.g. server types where the timeline isn't crawled)
      |> where([i, c, ci], c.statuses_seen > 0)
      |> select([i, c, ci], %{
        domain: i.domain,
        mentions: ci.self_mentions,
        interactions: c.interactions_seen
      })
      |> Repo.all(timeout: :infinity)
      |> Enum.map(fn %{domain: domain, mentions: mentions, interactions: interactions} ->
        insularity =
          cond do
            # if we haven't seen any self mentions, but there are interactions, it means that users on the instance
            # only mentions others, i.e. insularity is 0
            mentions == nil and interactions != 0 ->
              0.0

            interactions > 0 ->
              mentions / interactions

            true ->
              nil
          end

        %{
          domain: domain,
          insularity: insularity,
          inserted_at: now,
          updated_at: now
        }
      end)

    Instance
    |> Repo.insert_all(scores,
      on_conflict: {:replace, [:insularity, :updated_at]},
      conflict_target: :domain,
      timeout: :infinity
    )
  end

  @doc """
  This function calculates the average number of statuses per hour over the last month.
  """
  def generate_status_rate do
    now = get_now()
    # We want the earliest sucessful crawl so that we can exclude it from the statistics.
    # This is because the first crawl goes up to one month into the past -- this would mess up the counts!
    # The statistics from here assume that all statuses were written at exactly the crawl's inserted_at timestamp.
    earliest_crawl_subquery =
      Crawl
      |> group_by([c], c.instance_domain)
      |> select([c], %{
        instance_domain: c.instance_domain,
        earliest_crawl: min(c.inserted_at)
      })

    instances =
      Instance
      |> join(:inner, [i], c in Crawl, on: i.domain == c.instance_domain)
      |> join(:inner, [i], c2 in subquery(earliest_crawl_subquery),
        on: i.domain == c2.instance_domain
      )
      |> where(
        [i, c, c2],
        c.inserted_at > c2.earliest_crawl and c.statuses_seen > 0
      )
      |> select([i, c], %{
        domain: i.domain,
        status_count: sum(c.statuses_seen),
        second_earliest_crawl: min(c.inserted_at)
      })
      |> group_by([i], i.domain)
      |> Repo.all(timeout: :infinity)
      |> Enum.map(fn %{
                       domain: domain,
                       status_count: status_count,
                       second_earliest_crawl: oldest_timestamp
                     } ->
        time_diff_days = NaiveDateTime.diff(now, oldest_timestamp, :second) / (3600 * 24)

        # (we're actually only ever updating, not inserting, so inserted_at will always be ignored... but ecto
        # requires it)
        %{
          domain: domain,
          statuses_per_day: status_count / time_diff_days,
          updated_at: now,
          inserted_at: now
        }
      end)

    Instance
    |> Repo.insert_all(instances,
      on_conflict: {:replace, [:statuses_per_day, :updated_at]},
      conflict_target: :domain,
      timeout: :infinity
    )
  end

  @doc """
  This function aggregates statistics from the interactions in the database.
  It calculates the strength of edges between nodes. Self-edges are not generated.
  Edges are only generated if
  * both instances have been succesfully crawled
  * neither of the instances have blocked each other
  * there are interactions in each direction (if :require_bidirectional_edges is true in config)
  """
  def generate_edges do
    now = get_now()

    crawls_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        statuses_seen: sum(c.statuses_seen)
      })
      |> group_by([c], c.instance_domain)

    interactions =
      CrawlInteraction
      |> join(:inner, [ci], c_source in subquery(crawls_subquery),
        on: ci.source_domain == c_source.instance_domain
      )
      |> join(:inner, [ci], c_target in subquery(crawls_subquery),
        on: ci.target_domain == c_target.instance_domain
      )
      |> join(:inner, [ci], i_source in Instance, on: ci.source_domain == i_source.domain)
      |> join(:inner, [ci], i_target in Instance, on: ci.target_domain == i_target.domain)
      |> select([ci, c_source, c_target, i_source, i_target], %{
        source_domain: ci.source_domain,
        target_domain: ci.target_domain,
        mentions: sum(ci.mentions),
        # we can take min() because every row is the same
        source_type: min(i_source.type),
        target_type: min(i_target.type),
        source_statuses_seen: min(c_source.statuses_seen),
        target_statuses_seen: min(c_target.statuses_seen)
      })
      |> where([ci], ci.source_domain != ci.target_domain)
      |> group_by([ci], [ci.source_domain, ci.target_domain])
      |> Repo.all(timeout: :infinity)

    federation_blocks =
      FederationRestriction
      |> select([fr], {fr.source_domain, fr.target_domain})
      |> where([fr], fr.type == "reject")
      |> Repo.all()
      |> MapSet.new()

    new_edges =
      interactions
      |> filter_to_eligible_interactions(federation_blocks)
      |> combine_mention_directions()
      |> Enum.map(fn {{source_domain, target_domain}, {mention_count, statuses_seen}} ->
        %{
          source_domain: source_domain,
          target_domain: target_domain,
          weight: mention_count / statuses_seen,
          inserted_at: now,
          updated_at: now
        }
      end)

    # Get edges and their weights
    Repo.transaction(
      fn ->
        Edge
        |> Repo.delete_all(timeout: :infinity)

        Edge
        |> Repo.insert_all(new_edges, timeout: :infinity)
      end,
      timeout: :infinity
    )
  end

  @doc """
  This function checks to see if a lot of instances on the same base domain have been created recently. If so,
  notifies the server admin over SMS.
  """
  def check_for_spam_instances do
    hour_range = 3

    count_subquery =
      Instance
      |> where(
        [i],
        i.inserted_at > datetime_add(^NaiveDateTime.utc_now(), -1 * ^hour_range, "hour")
      )
      |> group_by(:base_domain)
      |> select([i], %{
        count: count(i.id),
        base_domain: i.base_domain
      })

    potential_spam_instances =
      Instance
      |> join(:inner, [i], c in subquery(count_subquery), on: i.domain == c.base_domain)
      |> where([i, c], c.count > 2)
      |> select([i, c], %{
        base_domain: i.base_domain,
        count: c.count
      })
      |> Repo.all()

    if length(potential_spam_instances) > 0 do
      message =
        potential_spam_instances
        |> Enum.map(fn %{count: count, base_domain: base_domain} ->
          "* #{count} new at #{base_domain}"
        end)
        |> Enum.join("\n")
        |> (fn lines ->
              "fediverse.space detected the following potential spam domains from the last #{
                hour_range
              } hours:\n#{lines}"
            end).()

      Logger.info(message)
      AdminEmail.send("Potential spam", message)
    else
      Logger.debug("Did not find potential spam instances.")
    end
  end

  # Takes a list of Interactions
  # Returns a map of %{{source, target} => {total_mention_count, total_statuses_seen}}
  defp combine_mention_directions(interactions) do
    Enum.reduce(interactions, %{}, fn
      %{
        source_domain: source_domain,
        target_domain: target_domain,
        mentions: mentions,
        source_statuses_seen: source_statuses_seen,
        target_statuses_seen: target_statuses_seen
      },
      acc ->
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
  end

  defp filter_to_eligible_interactions(interactions, federation_blocks) do
    # A map of {source_domain, target_domain} => mention_count. Used to find out whether a mention in the reverse
    # direction has been seen.
    mention_directions =
      interactions
      |> Enum.reduce(%{}, fn %{source_domain: source, target_domain: target, mentions: mentions},
                             acc ->
        Map.put(acc, {source, target}, mentions)
      end)

    interactions
    |> Enum.filter(&is_eligible_interaction?(&1, mention_directions, federation_blocks))
  end

  # Returns true if
  # * there's no federation block in either direction between the two instances
  # * there are mentions in both directions (if enabled in configuration)
  defp is_eligible_interaction?(
         %{
           source_domain: source,
           target_domain: target,
           mentions: mention_count,
           source_type: source_type,
           target_type: target_type
         },
         mention_directions,
         federation_blocks
       ) do
    mentions_were_seen = mention_count > 0

    # If :require_bidirectional_edges is set to `true` in the config, then an edge is only created if both instances
    # have mentioned each other
    opposite_mention_exists =
      if get_config(:require_bidirectional_mentions) and is_timeline_crawlable_type?(source_type) and
           is_timeline_crawlable_type?(target_type) do
        Map.has_key?(mention_directions, {target, source}) and
          Map.get(mention_directions, {target, source}) > 0
      else
        true
      end

    federation_block_exists =
      MapSet.member?(federation_blocks, {source, target}) or
        MapSet.member?(federation_blocks, {target, source})

    mentions_were_seen and opposite_mention_exists and not federation_block_exists
  end

  defp is_timeline_crawlable_type?(type) do
    Enum.member?(["mastodon", "gab", "pleroma", "gnusocial", "misskey"], type)
  end
end
