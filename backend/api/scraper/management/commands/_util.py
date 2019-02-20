from datetime import datetime

LOCK_MODES = (
    'ACCESS SHARE',
    'ROW SHARE',
    'ROW EXCLUSIVE',
    'SHARE UPDATE EXCLUSIVE',
    'SHARE',
    'SHARE ROW EXCLUSIVE',
    'EXCLUSIVE',
    'ACCESS EXCLUSIVE',
)


def require_lock(model, lock):
    """
    Decorator for PostgreSQL's table-level lock functionality

    Example:
        @transaction.commit_on_success
        @require_lock(MyModel, 'ACCESS EXCLUSIVE')
        def myview(request)
            ...

    PostgreSQL's LOCK Documentation:
    http://www.postgresql.org/docs/8.3/interactive/sql-lock.html
    """

    def require_lock_decorator(view_func):
        def wrapper(*args, **kwargs):
            if lock not in LOCK_MODES:
                raise ValueError('%s is not a PostgreSQL supported lock mode.')
            from django.db import connection
            cursor = connection.cursor()
            cursor.execute(
                'LOCK TABLE %s IN %s MODE' % (model._meta.db_table, lock)
            )
            return view_func(*args, **kwargs)

        return wrapper

    return require_lock_decorator


class InvalidResponseException(Exception):
    """Used for all responses other than HTTP 200"""
    pass


class PersonalInstanceException(Exception):
    """
    Used for instances that we don't want to scrape because there are too few users.
    We don't want information on individuals, but aggregate statistics on instances and how they interact.
    """
    pass


def get_key(data, keys: list):
    try:
        val = data[keys.pop(0)]
        while keys:
            val = val[keys.pop(0)]
        return val
    except (KeyError, TypeError):
        return ''


def validate_int(integer):
    return integer if (isinstance(integer, int) and 0 <= integer < 2147483647) else None


def log(text):
    return "{} - {}".format(datetime.now().isoformat(), text)
