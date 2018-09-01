import { Dispatch } from 'redux';

import { getFromApi } from '../util';
import { ActionType, IGraph, IInstance, IInstanceDetails } from './types';

// selectInstance and deselectInstance are not exported since we only call them from selectAndLoadInstance()
const selectInstance = (instanceName: string) => {
    return {
        payload: instanceName,
        type: ActionType.SELECT_INSTANCE,
    }
}
const deselectInstance = () => {
    return {
        type: ActionType.DESELECT_INSTANCE,
    }
}

export const requestInstances = () => {
    return {
        type: ActionType.REQUEST_INSTANCES,
    }
}

export const receiveInstances = (instances: IInstance[]) => {
    return {
        payload: instances,
        type: ActionType.RECEIVE_INSTANCES,
    }
}
export const requestGraph = () => {
    return {
        type: ActionType.REQUEST_GRAPH,
    }
}

export const receiveGraph = (graph: IGraph) => {
    return {
        payload: graph,
        type: ActionType.RECEIVE_GRAPH,
    }
}

export const receiveInstanceDetails = (instanceDetails: IInstanceDetails) => {
    return {
        payload: instanceDetails,
        type: ActionType.RECEIVE_INSTANCE_DETAILS,
    }
}


/** Async actions: https://redux.js.org/advanced/asyncactions */

export const fetchInstances = () => {
    // TODO: handle errors
    return (dispatch: Dispatch) => {
        dispatch(requestInstances());
        return getFromApi("instances")
            .then(instances => dispatch(receiveInstances(instances)));
    }
}

export const selectAndLoadInstance = (instanceName: string) => {
    // TODO: handle errors
    return (dispatch: Dispatch) => {
        if (!instanceName) {
            dispatch(deselectInstance());
            return;
        }
        dispatch(selectInstance(instanceName));
        return getFromApi("instances/" + instanceName)
            .then(details => dispatch(receiveInstanceDetails(details)));
    }
}

export const fetchGraph = () => {
    // TODO: handle errors
    return (dispatch: Dispatch) => {
        dispatch(requestGraph());
        return Promise.all([getFromApi("graph/edges"), getFromApi("graph/nodes")])
            .then(responses => {
                return {
                    edges: responses[0],
                    nodes: responses[1],
                };
            })
            .then(graph => dispatch(receiveGraph(graph)));
    }
}
