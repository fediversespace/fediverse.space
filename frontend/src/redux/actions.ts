import { Dispatch } from 'redux';

import { getFromApi } from '../util';
import { ActionType, IGraph, IInstance } from './types';

export const selectInstance = (instanceName: string) => {
    return {
        payload: instanceName,
        type: ActionType.SELECT_INSTANCE,
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

/** Async actions: https://redux.js.org/advanced/asyncactions */

export const fetchInstances = () => {
    // TODO: handle errors
    return (dispatch: Dispatch) => {
        dispatch(requestInstances());
        return getFromApi("instances")
            .then(instances => dispatch(receiveInstances(instances))
        );
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
            .then(graph => dispatch(receiveGraph(graph)))
    }
}
