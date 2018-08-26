"""
This script starts at a seed instance and loads the list of connected
peers. From there, it slowly scrapes the peers of all instances it finds,
gradually mapping the fediverse.
"""
import json
import multiprocessing
import requests
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

SEED = 'mastodon.social'
THREADS = 100
TIMEOUT = 10


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


def get_instance_info(instance_name: str):
    """Collect info about instance"""
    url = 'https://' + instance_name + '/api/v1/instance'
    response = requests.get(url, timeout=TIMEOUT)
    if response.status_code != 200:
        raise InvalidResponseError("Could not get info for {}".format(instance_name))
    return response.json()


def get_instance_peers(instance_name: str):
    """Collect connected instances"""
    url = 'https://' + instance_name + '/api/v1/instance/peers'
    response = requests.get(url, timeout=TIMEOUT)
    if response.status_code != 200:
        raise InvalidResponseError("Could not get peers for {}".format(instance_name))
    return response.json()


def process_instance(instance_name: str):
    """Given an instance, get all the data we're interested in"""
    print("Processing {}".format(instance_name))
    data = dict()
    try:
        data['instance'] = instance_name
        data['info'] = get_instance_info(instance_name)
        data['peers'] = get_instance_peers(instance_name)
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


def save_data(data):
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
        # TODO: optimization opportunity here if we do this in bulk
        # Make sure to consider race conditions
        # https://stackoverflow.com/q/24502658/3697202
        peers = [Instance.objects.get_or_create(name=n) for n in data['peers']]
        instance.peers.add(*[peers])
    else:
        stats = InstanceStats(
            instance=instance,
            status=get_key(data, ['status'])
        )
        stats.save()


def worker(queue: multiprocessing.JoinableQueue, done_bag: set):
    """The main worker that processes URLs"""
    while True:
        # Get an item from the queue. Block if the queue is empty.
        instance = queue.get()
        if instance in done_bag:
            print("Skipping {}, already done".format(instance))
            queue.task_done()
        else:
            data = process_instance(instance)
            if 'peers' in data:
                for peer in [p for p in data['peers'] if p not in done_bag]:
                    queue.put(peer)
            save_data(data)
            done_bag.add(instance)
            queue.task_done()


class Command(BaseCommand):
    help = "Scrapes the entire fediverse"


    def handle(self, *args, **options):
        done_bag = set()
        queue = multiprocessing.JoinableQueue()
        queue.put(SEED)
        pool = multiprocessing.Pool(THREADS, initializer=worker, initargs=(queue, done_bag))
        queue.join()
        self.stdout.write(self.style.SUCCESS("Successfully scraped the fediverse"))
