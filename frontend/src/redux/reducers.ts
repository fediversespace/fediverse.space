import { combineReducers } from 'redux';

import { ActionType, IAction, IDataState } from './types';

const initialDataState = {
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
        default:
            return state;
    }
}

const currentInstanceName = (state: string | null = null, action: IAction): string | null => {
    switch (action.type) {
        case ActionType.SELECT_INSTANCE:
            return action.payload;
        default:
            return state;
    }
}

export const rootReducer = combineReducers({
    currentInstanceName,
    data,
})