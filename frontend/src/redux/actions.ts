import fetch from 'cross-fetch';
import { Dispatch } from 'redux';

import { ActionType, IInstance } from './types';

const API_ROOT = "https://fediverse.space/api/v1"

export const selectInstance = (instance: string) => {
    return {
        payload: {
            instance,
        },
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

/** Async actions: https://redux.js.org/advanced/asyncactions */

export const fetchInstances = () => {
    // TODO: handle errors
    return (dispatch: Dispatch) => {
        dispatch(requestInstances());
        return fetch(`${API_ROOT}/instances/`)
            .then(response => response.json())
            .then(instances => dispatch(receiveInstances(instances))
        );
    }
}
