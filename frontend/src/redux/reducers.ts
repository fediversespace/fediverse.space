import { connectRouter } from "connected-react-router";
import { combineReducers } from "redux";

import { History } from "history";
import { ActionType, IAction, ICurrentInstanceState, IDataState } from "./types";

const initialDataState = {
  error: false,
  isLoadingGraph: false,
  isLoadingInstances: false
};
const data = (state: IDataState = initialDataState, action: IAction) => {
  switch (action.type) {
    case ActionType.REQUEST_INSTANCES:
      return {
        ...state,
        instances: [],
        isLoadingInstances: true
      };
    case ActionType.RECEIVE_INSTANCES:
      return {
        ...state,
        instances: action.payload,
        isLoadingInstances: false
      };
    case ActionType.REQUEST_GRAPH:
      return {
        ...state,
        isLoadingGraph: true
      };
    case ActionType.RECEIVE_GRAPH:
      return {
        ...state,
        graph: action.payload,
        isLoadingGraph: false
      };
    case ActionType.GRAPH_LOAD_ERROR:
      return {
        ...state,
        error: true,
        isLoadingGraph: false,
        isLoadingInstances: false
      };
    default:
      return state;
  }
};

const initialCurrentInstanceState: ICurrentInstanceState = {
  currentInstanceDetails: null,
  error: false,
  isLoadingInstanceDetails: false
};
const currentInstance = (state = initialCurrentInstanceState, action: IAction): ICurrentInstanceState => {
  switch (action.type) {
    case ActionType.REQUEST_INSTANCE_DETAILS:
      return {
        ...state,
        error: false,
        isLoadingInstanceDetails: true
      };
    case ActionType.RECEIVE_INSTANCE_DETAILS:
      return {
        ...state,
        currentInstanceDetails: action.payload,
        error: false,
        isLoadingInstanceDetails: false
      };
    case ActionType.DESELECT_INSTANCE:
      return {
        ...state,
        currentInstanceDetails: null,
        error: false
      };
    case ActionType.INSTANCE_LOAD_ERROR:
      return {
        ...state,
        error: true,
        isLoadingInstanceDetails: false
      };
    default:
      return state;
  }
};

export default (history: History) =>
  combineReducers({
    router: connectRouter(history),
    // tslint:disable-next-line:object-literal-sort-keys
    currentInstance,
    data
  });
