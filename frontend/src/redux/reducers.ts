import { connectRouter } from "connected-react-router";
import { combineReducers } from "redux";

import { History } from "history";
import { ActionType, IAction, ICurrentInstanceState, IDataState, ISearchState } from "./types";

const initialDataState = {
  error: false,
  isLoadingGraph: false
};
const data = (state: IDataState = initialDataState, action: IAction) => {
  switch (action.type) {
    case ActionType.REQUEST_GRAPH:
      return {
        ...state,
        graph: undefined,
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
        isLoadingGraph: false
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

const initialSearchState: ISearchState = {
  error: false,
  isLoadingResults: false,
  next: "",
  query: "",
  results: []
};
const search = (state = initialSearchState, action: IAction): ISearchState => {
  switch (action.type) {
    case ActionType.REQUEST_SEARCH_RESULTS:
      const query = action.payload;
      const isNewQuery = state.query !== query;
      return {
        ...state,
        error: false,
        isLoadingResults: true,
        query,
        results: isNewQuery ? [] : state.results
      };
    case ActionType.RECEIVE_SEARCH_RESULTS:
      return {
        ...state,
        error: false,
        isLoadingResults: false,
        next: action.payload.next,
        results: state.results.concat(action.payload.results)
      };
    case ActionType.SEARCH_RESULTS_ERROR:
      return {
        ...state,
        error: true,
        isLoadingResults: false,
        next: "",
        query: "",
        results: []
      };
    case ActionType.RESET_SEARCH:
      return initialSearchState;
    default:
      return state;
  }
};

export default (history: History) =>
  combineReducers({
    router: connectRouter(history),
    // tslint:disable-next-line:object-literal-sort-keys
    currentInstance,
    data,
    search
  });
