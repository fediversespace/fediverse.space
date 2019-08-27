import { connectRouter } from "connected-react-router";
import { isEqual } from "lodash";
import { combineReducers } from "redux";

import { History } from "history";
import { ActionType, IAction, ICurrentInstanceState, IDataState, ISearchState } from "./types";

const initialDataState: IDataState = {
  graphLoadError: false,
  instanceListLoadError: false,
  isLoadingGraph: false,
  isLoadingInstanceList: false
};
const data = (state: IDataState = initialDataState, action: IAction): IDataState => {
  switch (action.type) {
    case ActionType.REQUEST_GRAPH:
      return {
        ...state,
        graphResponse: undefined,
        isLoadingGraph: true
      };
    case ActionType.RECEIVE_GRAPH:
      return {
        ...state,
        graphResponse: action.payload,
        isLoadingGraph: false
      };
    case ActionType.GRAPH_LOAD_ERROR:
      return {
        ...state,
        graphLoadError: true,
        isLoadingGraph: false
      };
    case ActionType.REQUEST_INSTANCES:
      return {
        ...state,
        instanceListLoadError: false,
        instancesResponse: undefined,
        isLoadingInstanceList: true
      };
    case ActionType.RECEIVE_INSTANCES:
      return {
        ...state,
        instancesResponse: action.payload,
        isLoadingInstanceList: false
      };
    case ActionType.INSTANCE_LIST_LOAD_ERROR:
      return {
        ...state,
        instanceListLoadError: true,
        isLoadingInstanceList: false
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
  filters: [],
  isLoadingResults: false,
  next: "",
  query: "",
  results: []
};
const search = (state = initialSearchState, action: IAction): ISearchState => {
  switch (action.type) {
    case ActionType.REQUEST_SEARCH_RESULTS:
      const { query, filters } = action.payload;
      const isNewQuery = state.query !== query || !isEqual(state.filters, filters);
      return {
        ...state,
        error: false,
        filters,
        isLoadingResults: true,
        next: isNewQuery ? "" : state.next,
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
      return { ...initialSearchState, error: true };
    case ActionType.RESET_SEARCH:
      return initialSearchState;
    case ActionType.SET_SEARCH_RESULT_HOVER:
      return {
        ...state,
        hoveringOverResult: action.payload
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
    data,
    search
  });
