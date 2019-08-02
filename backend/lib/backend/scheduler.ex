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
  This function calculates the average number of statuses per hour over the last month.
  """
  def generate_status_rate() do
    now = get_now()
    # We want the earliest sucessful crawl so that we can exclude it from the statistics.
    # This is because the first crawl goes up to one month into the past -- this would mess up the counts!
    # The statistics from here assume that all statuses were written at exactly the crawl's inserted_at timestamp.
    earliest_successful_crawl_subquery =
      Crawl
      |> group_by([c], c.instance_domain)
      |> select([c], %{
        instance_domain: c.instance_domain,
        earliest_crawl: min(c.inserted_at)
      })

    instances =
      Crawl
      |> join(:inner, [c], c2 in subquery(earliest_successful_crawl_subquery),
        on: c.instance_domain == c2.instance_domain
      )
      |> where(
        [c, c2],
        c.inserted_at > c2.earliest_crawl and not is_nil(c.statuses_seen) and is_nil(c.error)
      )
      |> select([c], %{
        instance_domain: c.instance_domain,
        status_count: sum(c.statuses_seen),
        second_earliest_crawl: min(c.inserted_at)
      })
      |> group_by([c], c.instance_domain)
      |> Repo.all()
      |> Enum.map(fn %{
                       instance_domain: domain,
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
      conflict_target: :domain
    )
  end

  @doc """
  This function aggregates statistics from the interactions in the database.
  It calculates the strength of edges between nodes. Self-edges are not generated.
  Edges are only generated if both instances have been succesfully crawled.
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
      |> join(:inner, [ci], c_source in subquery(crawls_subquery),
        on: ci.source_domain == c_source.instance_domain
      )
      |> join(:inner, [ci], c_target in subquery(crawls_subquery),
        on: ci.target_domain == c_target.instance_domain
      )
      |> where([ci], ci.source_domain != ci.target_domain)
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

  @doc """
  This function checks to see if a lot of instances on the same base domain have been created recently. If so,
  notifies the server admin over SMS.
  """
  def check_for_spam_instances() do
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
      send_admin_sms(message)
      Backend.Mailer.AdminEmail.send("Potential spam", message)
    else
      Logger.debug("Did not find potential spam instances.")
    end
  end
end
