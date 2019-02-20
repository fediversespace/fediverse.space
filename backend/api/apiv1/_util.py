def to_representation(self, instance):
    """
    Object instance -> Dict of primitive datatypes.
    We use a custom to_representation function to exclude empty fields in the serialized JSON.
    """
    ret = super(InstanceListSerializer, self).to_representation(instance)
    ret = OrderedDict(list(filter(lambda x: x[1], ret.items())))
    return ret
