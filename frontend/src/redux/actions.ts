import { isEqual } from "lodash";
import { Dispatch } from "redux";

import { push } from "connected-react-router";
import { SearchFilter } from "../searchFilters";
import { getFromApi } from "../util";
import { ActionType, AppState, Graph, InstanceDetails, InstanceSort, SearchResponse } from "./types";

// Instance details
const requestInstanceDetails = (instanceName: string) => ({
  payload: instanceName,
  type: ActionType.REQUEST_INSTANCE_DETAILS,
});
const receiveInstanceDetails = (instanceDetails: InstanceDetails) => ({
  payload: instanceDetails,
  type: ActionType.RECEIVE_INSTANCE_DETAILS,
});
const instanceLoadFailed = () => ({
  type: ActionType.INSTANCE_LOAD_ERROR,
});
const deselectInstance = () => ({
  type: ActionType.DESELECT_INSTANCE,
});

// Graph
const requestGraph = () => ({
  type: ActionType.REQUEST_GRAPH,
});
const receiveGraph = (graph: Graph) => ({
  payload: graph,
  type: ActionType.RECEIVE_GRAPH,
});
const graphLoadFailed = () => ({
  type: ActionType.GRAPH_LOAD_ERROR,
});

// Instance list
const requestInstanceList = (sort?: InstanceSort) => ({
  payload: sort,
  type: ActionType.REQUEST_INSTANCES,
});
const receiveInstanceList = (instances: InstanceDetails[]) => ({
  payload: instances,
  type: ActionType.RECEIVE_INSTANCES,
});
const instanceListLoadFailed = () => ({
  type: ActionType.INSTANCE_LIST_LOAD_ERROR,
});

// Search
const requestSearchResult = (query: string, filters: SearchFilter[]) => ({
  payload: { query, filters },
  type: ActionType.REQUEST_SEARCH_RESULTS,
});
const receiveSearchResults = (result: SearchResponse) => ({
  payload: result,
  type: ActionType.RECEIVE_SEARCH_RESULTS,
});
const searchFailed = () => ({
  type: ActionType.SEARCH_RESULTS_ERROR,
});

const resetSearch = () => ({
  type: ActionType.RESET_SEARCH,
});

export const setResultHover = (domain?: string) => ({
  payload: domain,
  type: ActionType.SET_SEARCH_RESULT_HOVER,
});

/** Async actions: https://redux.js.org/advanced/asyncactions */

export const loadInstance = (instanceName: string | null) => (dispatch: Dispatch, getState: () => AppState) => {
  if (!instanceName) {
    dispatch(deselectInstance());
    if (getState().router.location.pathname.startsWith("/instance/")) {
      dispatch(push("/"));
    }
    return;
  }
  dispatch(requestInstanceDetails(instanceName));
  return getFromApi(`instances/${instanceName}`)
    .then((details) => dispatch(receiveInstanceDetails(details)))
    .catch(() => dispatch(instanceLoadFailed()));
};

export const updateSearch =
  (query: string, filters: SearchFilter[]) => (dispatch: Dispatch, getState: () => AppState) => {
    query = query.trim();

    if (!query) {
      dispatch(resetSearch());
      return;
    }

    const prevQuery = getState().search.query;
    const prevFilters = getState().search.filters;
    const isNewQuery = prevQuery !== query || !isEqual(prevFilters, filters);

    const { next } = getState().search;
    let url = `search/?query=${query}`;
    if (!isNewQuery && next) {
      url += `&after=${next}`;
    }

    // Add filters
    // The format is e.g. type_eq=mastodon or user_count_gt=1000
    filters.forEach((filter) => {
      url += `&${filter.field}_${filter.relation}=${filter.value}`;
    });

    dispatch(requestSearchResult(query, filters));
    return getFromApi(url)
      .then((result) => dispatch(receiveSearchResults(result)))
      .catch(() => dispatch(searchFailed()));
  };

export const fetchGraph = () => (dispatch: Dispatch) => {
  dispatch(requestGraph());
  return getFromApi("graph")
    .then((graph) => dispatch(receiveGraph(graph)))
    .catch(() => dispatch(graphLoadFailed()));
};

export const loadInstanceList =
  (page?: number, sort?: InstanceSort) => (dispatch: Dispatch, getState: () => AppState) => {
    sort = sort || getState().data.instanceListSort;
    dispatch(requestInstanceList(sort));
    const params: string[] = [];
    if (page) {
      params.push(`page=${page}`);
    }
    if (sort) {
      params.push(`sortField=${sort.field}`);
      params.push(`sortDirection=${sort.direction}`);
    }
    const path = params ? `instances?${params.join("&")}` : "instances";
    return getFromApi(path)
      .then((instancesListResponse) => dispatch(receiveInstanceList(instancesListResponse)))
      .catch(() => dispatch(instanceListLoadFailed()));
  };
