import { combineReducers } from 'redux';

import { ActionType, IAction, ICurrentInstanceState, IDataState } from './types';

const initialDataState = {
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
        default:
            return state;
    }
}

const initialCurrentInstanceState = {
    currentInstanceDetails: null,
    currentInstanceName: null,
    isLoadingInstanceDetails: false
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
        default:
            return state;
    }
}

export const rootReducer = combineReducers({
    currentInstance,
    data,
})