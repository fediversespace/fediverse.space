"""
This script starts at a seed instance and loads the list of connected
peers. From there, it scrapes the peers of all instances it finds,
gradually mapping the fediverse.
"""
import json
import multiprocessing as mp
import requests
import time
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django import db
from scraper.models import Instance, PeerRelationship
from scraper.management.commands._util import require_lock, InvalidResponseError, get_key, log, validate_int

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
TIMEOUT = 10
NUM_THREADS = 4


class Command(BaseCommand):
    help = "Scrapes the entire fediverse"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.done_bag = set()

    @staticmethod
    def get_instance_info(instance_name: str):
        """Collect info about instance"""
        url = 'https://' + instance_name + '/api/v1/instance'
        response = requests.get(url, timeout=TIMEOUT)
        if response.status_code != 200:
            raise InvalidResponseError("Could not get info for {}".format(instance_name))
        return response.json()

    @staticmethod
    def get_instance_peers(instance_name: str):
        """Collect connected instances"""
        # The peers endpoint returns a "list of all domain names known to this instance"
        # (https://github.com/tootsuite/mastodon/pull/6125)
        url = 'https://' + instance_name + '/api/v1/instance/peers'
        response = requests.get(url, timeout=TIMEOUT)
        json = response.json()
        if response.status_code != 200 or not isinstance(json, list):
            raise InvalidResponseError("Could not get peers for {}".format(instance_name))
        return json

    def process_instance(self, instance: Instance):
        """Given an instance, get all the data we're interested in"""
        data = dict()
        try:
            data['instance_name'] = instance.name
            data['info'] = self.get_instance_info(instance.name)
            # Get rid of peers that just say "null" and the instance itself
            data['peers'] = [peer for peer in self.get_instance_peers(instance.name) if peer and peer != instance.name]
            if not data['info'] and not data['peers']:
                # We got a response from the instance, but it didn't have any of the information we were expecting.
                raise InvalidResponseError
            data['status'] = 'success'
            return data
        except (InvalidResponseError,
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
            print("Before: {}".format(len(existing_instance_ids)))
            existing_instance_ids.extend(new_instance_ids)
            print("After: {}".format(len(existing_instance_ids)))
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
        self.stdout.write(log("Saved {}".format(data['instance_name'])))

    def worker(self, queue: mp.JoinableQueue, existing_instance_ids):
        """The main worker that processes URLs"""
        # https://stackoverflow.com/a/38356519/3697202
        db.connections.close_all()
        while True:
            instance = queue.get()
            if instance in self.done_bag:
                self.stderr.write(log("Skipping {}, already done. This should not have been added to the queue!".format(instance)))
                queue.task_done()
            else:
                # Fetch data on instance
                self.stdout.write(log("Processing {}".format(instance.name)))
                data = self.process_instance(instance)
                self.save_data(instance, data, queue, existing_instance_ids)
                self.done_bag.add(instance)
                queue.task_done()

    def handle(self, *args, **options):
        start_time = time.time()
        stale_instances = Instance.objects.filter(last_updated__lte=datetime.now()-timedelta(weeks=1))
        with mp.Manager() as manager:
            # Share the list of existing instances amongst all threads (to avoid each thread having to query
            # for it on every instance it scrapes)
            existing_instance_ids = manager.list(list(Instance.objects.values_list('name', flat=True)))
            queue = mp.JoinableQueue()
            if stale_instances:
                queue.put(list(stale_instances))
            elif not Instance.objects.exists():
                instance, _ = Instance.objects.get_or_create(name=SEED)
                queue.put(instance)
                existing_instance_ids.append(instance.name)

            pool = mp.Pool(NUM_THREADS, initializer=self.worker, initargs=(queue, existing_instance_ids))
            queue.join()
        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(log("Successfully scraped the fediverse in {:.0f}s".format(end_time-start_time))))
