"""
This script starts at a seed instance and loads the list of connected
peers. From there, it scrapes the peers of all instances it finds,
gradually mapping the fediverse.
"""
import json
import multiprocessing as mp
import requests
import time
from dateutil.parser import parse as datetime_parser
from datetime import datetime, timedelta, timezone
from functional import seq
from django_bulk_update.helper import bulk_update
from django.core.management.base import BaseCommand
from django import db
from scraper.models import Instance, PeerRelationship
from scraper.management.commands._util import require_lock, InvalidResponseException, get_key, log, validate_int, PersonalInstanceException

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Because the script uses the Mastodon API other platforms like         #
# Pleroma, Peertube, Pixelfed, Funkwhale won't have outgoing peers.     #
#                                                                       #
# The script generates two files:                                       #
# - nodes.csv                                                           #
# - edges.csv                                                           #
#                                                                       #
# Change SEED to start from a different instance.                       #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# TODO: use the /api/v1/server/followers and /api/v1/server/following endpoints in peertube instances

SEED = 'mastodon.social'
TIMEOUT = 20  # seconds
NUM_THREADS = 64
PERSONAL_INSTANCE_THRESHOLD = 5  # instances with <= this many users won't be scraped
STATUS_SCRAPE_LIMIT = 5000


class Command(BaseCommand):
    help = "Scrapes the entire fediverse"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.scraped_count = 0

    @staticmethod
    def get_instance_info(instance_name: str):
        """Collect info about instance"""
        url = 'https://' + instance_name + '/api/v1/instance'
        response = requests.get(url, timeout=TIMEOUT)
        json = response.json()
        if response.status_code != 200 or get_key(json, ['error']):
            raise InvalidResponseException("Could not get info for {}".format(instance_name))
        return json

    @staticmethod
    def get_instance_peers(instance_name: str):
        """Collect connected instances"""
        # The peers endpoint returns a "list of all domain names known to this instance"
        # (https://github.com/tootsuite/mastodon/pull/6125)
        url = 'https://' + instance_name + '/api/v1/instance/peers'
        response = requests.get(url, timeout=TIMEOUT)
        peers = response.json()
        if response.status_code != 200 or not isinstance(peers, list) or get_key(peers, ['error']):
            raise InvalidResponseException("Could not get peers for {}".format(instance_name))
        # Get rid of peers that just say "null" and the instance itself
        return [peer for peer in peers if peer and peer != instance_name]

    @staticmethod
    def get_statuses(instance_name: str):
        """Collect all statuses that mention users on other instances"""
        mentions = []
        datetime_threshold = datetime.now(timezone.utc) - timedelta(days=31)
        statuses_seen = 0
        # We'll ask for 1000 statuses, but Mastodon never returns more than 40. Some Pleroma instances will ignore
        # the limit and return 20.
        url = 'https://' + instance_name + '/api/v1/timelines/public?local=true&limit=1000'
        while True:
            response = requests.get(url, timeout=TIMEOUT)
            statuses = response.json()
            if response.status_code != 200 or get_key(statuses, ['error']):
                raise InvalidResponseException("Could not get statuses for {}".format(instance_name))
            elif len(statuses) == 0:
                break
            # Get mentions from this instance
            mentions.extend((seq(statuses)
                            .filter(lambda s: datetime_parser(s['created_at']) > datetime_threshold)
                            .flat_map(lambda s: s['mentions'])))  # map to mentions

            # Find out if we should stop here
            earliest_status = statuses[-1]
            earliest_time_seen = datetime_parser(earliest_status['created_at'])
            statuses_seen += len(statuses)
            # Mastodon returns max 40 statuses; if we ever see less than that we know there aren't any more
            if earliest_time_seen < datetime_threshold or statuses_seen >= STATUS_SCRAPE_LIMIT:
                break
            # Continuing, so get url for next page
            min_id = earliest_status['id']
            url = 'https://' + instance_name + '/api/v1/timelines/public?local=true&limit=1000&max_id=' + min_id

        mentions_seq = (seq(mentions)
                        .filter(lambda m: not m['acct'].endswith(instance_name) and '@' in m['acct'])
                        .map(lambda m: m['acct'].split('@')[-1])  # map to instance name
                        .map(lambda m: (m, 1))
                        .reduce_by_key(lambda x, y: x+y))  # sequence of tuples (instance, count)
        mentions_by_instance = {t[0]: t[1] for t in mentions_seq}  # dict of instance -> number of mentions

        return mentions_by_instance, statuses_seen

    def process_instance(self, instance: Instance):
        """Given an instance, get all the data we're interested in"""
        data = dict()
        try:
            data['instance_name'] = instance.name
            data['info'] = self.get_instance_info(instance.name)

            # Check if this is a personal instance before continuing
            user_count = get_key(data, ['info', 'stats', 'user_count'])
            if isinstance(user_count, int) and user_count < PERSONAL_INSTANCE_THRESHOLD:
                raise PersonalInstanceException

            data['peers'] = self.get_instance_peers(instance.name)
            if not data['info'] and not data['peers']:
                # We got a response from the instance, but it didn't have any of the information we were expecting.
                raise InvalidResponseException

            data['mentions'], data['statuses_seen'] = self.get_statuses(instance.name)
            data['status'] = 'success'
            return data

        except (InvalidResponseException,
                PersonalInstanceException,
                requests.exceptions.RequestException,
                json.decoder.JSONDecodeError) as e:
            data['instance_name'] = instance.name
            data['status'] = type(e).__name__
            return data

    @db.transaction.atomic
    @require_lock(Instance, 'ACCESS EXCLUSIVE')
    def save_data(self, instance, data, queue, existing_instance_ids):
        """Save data"""
        # Validate the ints. Some servers that appear to be fake instances have e.g. negative numbers here.
        instance.domain_count = validate_int(get_key(data, ['info', 'stats', 'domain_count']))
        instance.status_count = validate_int(get_key(data, ['info', 'stats', 'status_count']))
        instance.user_count = validate_int(get_key(data, ['info', 'stats', 'user_count']))
        instance.description = get_key(data, ['info', 'description'])
        instance.version = get_key(data, ['info', 'version'])
        instance.status = get_key(data, ['status'])
        instance.save()
        if data['status'] == 'success' and data['peers']:
            # TODO: handle a peer disappeer-ing
            # Create instances for the peers we haven't seen before and add them to the queue
            new_instance_ids = [peer_id for peer_id in data['peers'] if peer_id not in existing_instance_ids]
            # bulk_create doesn't call save(), so the auto_now_add field won't get set automatically
            new_instances = [Instance(name=id, first_seen=datetime.now(), last_updated=datetime.now())
                             for id in new_instance_ids]
            existing_instance_ids.extend(new_instance_ids)
            Instance.objects.bulk_create(new_instances)
            for new_instance in new_instances:
                queue.put(new_instance)

            # Create relationships we haven't seen before
            existing_peer_ids = PeerRelationship.objects.filter(source=instance).values_list('target', flat=True)
            new_peer_ids = [peer_id for peer_id in data['peers'] if peer_id not in existing_peer_ids]
            if new_peer_ids:
                # new_peers = Instance.objects.filter(name__in=new_peer_ids)
                new_relationships = [PeerRelationship(source=instance, target_id=new_peer, first_seen=datetime.now())
                                     for new_peer in new_peer_ids]
                PeerRelationship.objects.bulk_create(new_relationships)

        if data['status'] == 'success' and data['mentions']:
            # At this point, we can assume that a relationship exists for every peer that's mentioned in statuses
            mentions = data['mentions']
            relationships = PeerRelationship.objects.filter(source=instance,
                                                            target_id__in=list(mentions.keys()))
            for relationship in relationships:
                relationship.mention_count = mentions[relationship.target_id]
                relationship.statuses_seen = data['statuses_seen']
                relationship.last_updated = datetime.now()
            bulk_update(relationships, update_fields=['mention_count', 'statuses_seen', 'last_updated'])

        self.stdout.write(log("Saved {}".format(data['instance_name'])))

    def worker(self, queue: mp.JoinableQueue, existing_instance_ids, scraped_ids):
        """The main worker that processes URLs"""
        # https://stackoverflow.com/a/38356519/3697202
        db.connections.close_all()
        while True:
            instance = queue.get()
            if instance.name in scraped_ids:
                self.stderr.write(log("Skipping {}, already done. This should not have been added to the queue!"
                                      .format(instance)))
                queue.task_done()
            else:
                # Fetch data on instance
                self.stdout.write(log("Processing {}".format(instance.name)))
                data = self.process_instance(instance)
                self.save_data(instance, data, queue, existing_instance_ids)
                scraped_ids[instance.name] = 1
                queue.task_done()

    def handle(self, *args, **options):
        start_time = time.time()
        stale_instances = Instance.objects.filter(last_updated__lte=datetime.now()-timedelta(days=1))
        with mp.Manager() as manager:
            # Share the list of existing instances amongst all threads (to avoid each thread having to query
            # for it on every instance it scrapes)
            existing_instance_ids = manager.list(list(Instance.objects.values_list('name', flat=True)))
            scraped_ids = manager.dict()
            queue = mp.JoinableQueue()
            if stale_instances:
                for instance in stale_instances:
                    queue.put(instance)
            elif not Instance.objects.exists():
                instance, _ = Instance.objects.get_or_create(name=SEED)
                existing_instance_ids.append(instance.name)
                queue.put(instance)

            pool = mp.Pool(NUM_THREADS, initializer=self.worker, initargs=(queue, existing_instance_ids, scraped_ids))
            queue.join()
            self.scraped_count = len(scraped_ids.keys())

        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(log("Scraped {} instances in {:.0f}s"
                                                 .format(self.scraped_count, end_time - start_time))))
