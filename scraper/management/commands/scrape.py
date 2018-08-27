"""
This script starts at a seed instance and loads the list of connected
peers. From there, it scrapes the peers of all instances it finds,
gradually mapping the fediverse.
"""
import json
import multiprocessing
import requests
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from scraper.models import Instance, InstanceStats
from scraper.management.commands._util import require_lock, InvalidResponseError, get_key

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

SEED = 'geekly.social'
TIMEOUT = 20


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
        url = 'https://' + instance_name + '/api/v1/instance/peers'
        response = requests.get(url, timeout=TIMEOUT)
        if response.status_code != 200:
            raise InvalidResponseError("Could not get peers for {}".format(instance_name))
        return response.json()

    def process_instance(self, instance_name: str):
        """Given an instance, get all the data we're interested in"""
        self.stdout.write("{} - Processing {}".format(datetime.now().isoformat(), instance_name))
        data = dict()
        try:
            data['instance'] = instance_name
            data['info'] = self.get_instance_info(instance_name)
            data['peers'] = [peer for peer in self.get_instance_peers(instance_name) if peer]  # get rid of null peers
            data['status'] = 'success'
            return data
        except (InvalidResponseError,
                requests.exceptions.RequestException,
                json.decoder.JSONDecodeError) as e:
            data['instance'] = instance_name
            data['status'] = type(e).__name__
            return data

    @transaction.atomic
    @require_lock(Instance, 'ACCESS EXCLUSIVE')
    def save_data(self, data):
        """Save data"""
        instance, _ = Instance.objects.get_or_create(name=get_key(data, ['instance']))
        if data['status'] == 'success':
            # Save stats
            stats = InstanceStats(
                instance=instance,
                num_peers=get_key(data, ['info', 'stats', 'domain_count']),
                num_statuses=get_key(data, ['info', 'stats', 'status_count']),
                num_users=get_key(data, ['info', 'stats', 'user_count']),
                version=get_key(data, ['info', 'version']),
                status=get_key(data, ['status']),
            )
            stats.save()
            # Save peers
            # TODO: make this shared amongst threads so the database only needs to be queried once
            if not data['peers']:
                return
            existing_instance_ids = Instance.objects.values_list('name', flat=True)
            existing_peers = Instance.objects.filter(name__in=existing_instance_ids)
            new_peer_ids = [peer for peer in data['peers'] if peer not in existing_instance_ids]
            if new_peer_ids:
                new_peers = Instance.objects.bulk_create([Instance(name=peer) for peer in new_peer_ids])
                instance.peers.set(new_peers)
            instance.peers.set(existing_peers)
        else:
            stats = InstanceStats(
                instance=instance,
                status=get_key(data, ['status'])
            )
            stats.save()
        self.stdout.write("{} - Saved {}".format(datetime.now().isoformat(), data['instance']))

    def worker(self, queue: multiprocessing.JoinableQueue):
        """The main worker that processes URLs"""
        while True:
            # Get an item from the queue. Block if the queue is empty.
            instance = queue.get()
            if instance in self.done_bag:
                print("Skipping {}, already done".format(instance))
                queue.task_done()
            else:
                data = self.process_instance(instance)
                if 'peers' in data:
                    for peer in [p for p in data['peers'] if p not in self.done_bag]:
                        queue.put(peer)
                self.save_data(data)
                self.done_bag.add(instance)
                queue.task_done()

    def handle(self, *args, **options):
        start_time = time.time()
        queue = multiprocessing.JoinableQueue()
        queue.put(SEED)
        # pool = multiprocessing.Pool(1, initializer=self.worker, initargs=(queue, ))  # Disable concurrency (debug)
        pool = multiprocessing.Pool(initializer=self.worker, initargs=(queue, ))
        queue.join()
        end_time = time.time()
        self.stdout.write(self.style.SUCCESS("Successfully scraped the fediverse in {:.0f}s".format(end_time-start_time)))
