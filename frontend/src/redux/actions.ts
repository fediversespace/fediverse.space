import { isEqual } from "lodash";
import { Dispatch } from "redux";

import { push } from "connected-react-router";
import { ISearchFilter } from "../searchFilters";
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

// Instance list
const requestInstanceList = () => ({
  type: ActionType.REQUEST_INSTANCES
});
const receiveInstanceList = (instances: IInstanceDetails[]) => ({
  payload: instances,
  type: ActionType.RECEIVE_INSTANCES
});
const instanceListLoadFailed = () => ({
  type: ActionType.INSTANCE_LIST_LOAD_ERROR
});

// Search
const requestSearchResult = (query: string, filters: ISearchFilter[]) => {
  return {
    payload: { query, filters },
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

export const setResultHover = (domain?: string) => {
  return {
    payload: domain,
    type: ActionType.SET_SEARCH_RESULT_HOVER
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

export const updateSearch = (query: string, filters: ISearchFilter[]) => {
  return (dispatch: Dispatch, getState: () => IAppState) => {
    query = query.trim();

    if (!query) {
      dispatch(resetSearch());
      return;
    }

    const prevQuery = getState().search.query;
    const prevFilters = getState().search.filters;
    const isNewQuery = prevQuery !== query || !isEqual(prevFilters, filters);

    const next = getState().search.next;
    let url = `search/?query=${query}`;
    if (!isNewQuery && next) {
      url += `&after=${next}`;
    }

    // Add filters
    // The format is e.g. type_eq=mastodon or user_count_gt=1000
    filters.forEach(filter => {
      url += `&${filter.field}_${filter.relation}=${filter.value}`;
    });

    dispatch(requestSearchResult(query, filters));
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

export const loadInstanceList = (page?: number) => {
  return (dispatch: Dispatch) => {
    dispatch(requestInstanceList());
    let params = "";
    if (!!page) {
      params += `page=${page}`;
    }
    const path = !!params ? `instances?${params}` : "instances";
    return getFromApi(path)
      .then(instancesListResponse => dispatch(receiveInstanceList(instancesListResponse)))
      .catch(() => dispatch(instanceListLoadFailed()));
  };
};
