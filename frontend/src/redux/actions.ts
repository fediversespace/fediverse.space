import { Dispatch } from "redux";

import { push } from "connected-react-router";
import { getFromApi } from "../util";
import { ActionType, IAppState, IGraph, IInstanceDetails, ISearchResponse } from "./types";

// Instance details
const requestInstanceDetails = (instanceName: string) => {
  return {
    payload: instanceName,
    type: ActionType.REQUEST_INSTANCE_DETAILS
  };
};
const receiveInstanceDetails = (instanceDetails: IInstanceDetails) => {
  return {
    payload: instanceDetails,
    type: ActionType.RECEIVE_INSTANCE_DETAILS
  };
};
const instanceLoadFailed = () => {
  return {
    type: ActionType.INSTANCE_LOAD_ERROR
  };
};
const deselectInstance = () => {
  return {
    type: ActionType.DESELECT_INSTANCE
  };
};

// Graph
const requestGraph = () => {
  return {
    type: ActionType.REQUEST_GRAPH
  };
};
const receiveGraph = (graph: IGraph) => {
  return {
    payload: graph,
    type: ActionType.RECEIVE_GRAPH
  };
};
const graphLoadFailed = () => {
  return {
    type: ActionType.GRAPH_LOAD_ERROR
  };
};

// Search
const requestSearchResult = (query: string) => {
  return {
    payload: query,
    type: ActionType.REQUEST_SEARCH_RESULTS
  };
};
const receiveSearchResults = (result: ISearchResponse) => {
  return {
    payload: result,
    type: ActionType.RECEIVE_SEARCH_RESULTS
  };
};
const searchFailed = () => {
  return {
    type: ActionType.SEARCH_RESULTS_ERROR
  };
};

const resetSearch = () => {
  return {
    type: ActionType.RESET_SEARCH
  };
};

/** Async actions: https://redux.js.org/advanced/asyncactions */

export const loadInstance = (instanceName: string | null) => {
  return (dispatch: Dispatch, getState: () => IAppState) => {
    if (!instanceName) {
      dispatch(deselectInstance());
      if (getState().router.location.pathname.startsWith("/instance/")) {
        dispatch(push("/"));
      }
      return;
    }
    dispatch(requestInstanceDetails(instanceName));
    return getFromApi("instances/" + instanceName)
      .then(details => dispatch(receiveInstanceDetails(details)))
      .catch(() => dispatch(instanceLoadFailed()));
  };
};

export const updateSearch = (query: string) => {
  return (dispatch: Dispatch, getState: () => IAppState) => {
    if (!query) {
      dispatch(resetSearch());
      return;
    }

    const next = getState().search.next;
    let url = `search/?query=${query}`;
    if (next) {
      url += `&after=${next}`;
    }
    dispatch(requestSearchResult(query));
    return getFromApi(url)
      .then(result => dispatch(receiveSearchResults(result)))
      .catch(() => dispatch(searchFailed()));
  };
};

export const fetchGraph = () => {
  return (dispatch: Dispatch) => {
    dispatch(requestGraph());
    return getFromApi("graph")
      .then(graph => dispatch(receiveGraph(graph)))
      .catch(() => dispatch(graphLoadFailed()));
  };
};
