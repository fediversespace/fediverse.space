"""
This script starts at a seed instance and loads the list of connected
peers. From there, it scrapes the peers of all instances it finds,
gradually mapping the fediverse.
"""
import json
import multiprocessing
import requests
import time
from django.core.management.base import BaseCommand
from scraper.models import Instance, InstanceStats

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
TIMEOUT = 20


class InvalidResponseError(Exception):
    """Used for all responses other than HTTP 200"""
    pass


def get_key(data, keys: list):
    try:
        val = data[keys.pop(0)]
        while keys:
            val = val[keys.pop(0)]
        return val
    except KeyError:
        return ''


class Command(BaseCommand):
    help = "Scrapes the entire fediverse"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.done_bag = set()
        self.existing_instance_ids = []

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
        print("Processing {}".format(instance_name))
        data = dict()
        try:
            data['instance'] = instance_name
            data['info'] = self.get_instance_info(instance_name)
            data['peers'] = self.get_instance_peers(instance_name)
            data['status'] = 'success'
            print("Processed: {}".format(instance_name))
            return data
        except (InvalidResponseError,
                requests.exceptions.RequestException,
                json.decoder.JSONDecodeError) as e:
            data['instance'] = instance_name
            data['status'] = type(e).__name__
            print("Failed: {}".format(instance_name))
            return data

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
            # Save the list of instances we already have in the database
            existing_peers = Instance.objects.filter(name__in=self.existing_instance_ids)
            print("setting new_peer_ids")
            new_peer_ids = [peer for peer in data['peers'] if peer not in self.existing_instance_ids]
            if new_peer_ids:
                print("setting new_peers (ids: {})".format(new_peer_ids))
                new_peers = Instance.objects.bulk_create([Instance(name=peer) for peer in new_peer_ids])
                print("adding to existing_instance_ids")
                self.existing_instance_ids.extend(new_peer_ids)
                print("adding new peers")
                instance.peers.set(new_peers)
            print("adding existing peers")
            instance.peers.set(existing_peers)
        else:
            stats = InstanceStats(
                instance=instance,
                status=get_key(data, ['status'])
            )
            stats.save()

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
        self.existing_instance_ids = Instance.objects.all().values_list('name', flat=True)
        print("Existing instances: {}".format(self.existing_instance_ids))
        queue = multiprocessing.JoinableQueue()
        queue.put(SEED)
        # pool = multiprocessing.Pool(1, initializer=self.worker, initargs=(queue, ))  # Disable concurrency (debug)
        pool = multiprocessing.Pool(initializer=self.worker, initargs=(queue, ))
        queue.join()
        end_time = time.time()
        self.stdout.write(self.style.SUCCESS("Successfully scraped the fediverse in {}s".format(end_time-start_time)))
