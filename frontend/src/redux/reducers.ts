import { combineReducers } from 'redux';

import { ActionType, IAction, ICurrentInstanceState, IDataState } from './types';

const initialDataState = {
    error: false,
    isLoadingGraph: false,
    isLoadingInstances: false,
}
const data = (state: IDataState = initialDataState, action: IAction) => {
    switch (action.type) {
        case ActionType.REQUEST_INSTANCES:
            return {
                ...state,
                instances: [],
                isLoadingInstances: true,
            };
        case ActionType.RECEIVE_INSTANCES:
            return {
                ...state,
                instances: action.payload,
                isLoadingInstances: false,
            };
        case ActionType.REQUEST_GRAPH:
            return {
                ...state,
                isLoadingGraph: true,
            };
        case ActionType.RECEIVE_GRAPH:
            return {
                ...state,
                graph: action.payload,
                isLoadingGraph: false,
            };
        case ActionType.GRAPH_LOAD_ERROR:
            return {
                ...state,
                error: true,
                isLoadingGraph: false,
                isLoadingInstances: false,
            };
        default:
            return state;
    }
}

const initialCurrentInstanceState = {
    currentInstanceDetails: null,
    currentInstanceName: null,
    error: false,
    isLoadingInstanceDetails: false,
};
const currentInstance = (state = initialCurrentInstanceState , action: IAction): ICurrentInstanceState => {
    switch (action.type) {
        case ActionType.SELECT_INSTANCE:
            return {
                ...state,
                currentInstanceName: action.payload,
                isLoadingInstanceDetails: true,
            };
        case ActionType.RECEIVE_INSTANCE_DETAILS:
            return {
                ...state,
                currentInstanceDetails: action.payload,
                isLoadingInstanceDetails: false,
            }
        case ActionType.DESELECT_INSTANCE:
            return {
                ...state,
                currentInstanceDetails: null,
                currentInstanceName: null,
            }
        case ActionType.INSTANCE_LOAD_ERROR:
            return {
                ...state,
                error: true,
                isLoadingInstanceDetails: false,
            };
        default:
            return state;
    }
}

export const rootReducer = combineReducers({
    currentInstance,
    data,
})