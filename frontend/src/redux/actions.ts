import { Dispatch } from 'redux';

import { getFromApi } from '../util';
import { ActionType, IInstance } from './types';

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
        return getFromApi("instances")
            .then(response => {
                return response.json();
            })
            .then(instances => dispatch(receiveInstances(instances))
        );
    }
}
