import { Dispatch } from "redux";

import { push } from "connected-react-router";
import { getFromApi } from "../util";
import { ActionType, IAppState, IGraph, IInstance, IInstanceDetails } from "./types";

// requestInstanceDetails and deselectInstance are not exported since we only call them from loadInstance()
const requestInstanceDetails = (instanceName: string) => {
  return {
    payload: instanceName,
    type: ActionType.REQUEST_INSTANCE_DETAILS
  };
};
const deselectInstance = () => {
  return {
    type: ActionType.DESELECT_INSTANCE
  };
};

export const requestInstances = () => {
  return {
    type: ActionType.REQUEST_INSTANCES
  };
};

export const receiveInstances = (instances: IInstance[]) => {
  return {
    payload: instances,
    type: ActionType.RECEIVE_INSTANCES
  };
};
export const requestGraph = () => {
  return {
    type: ActionType.REQUEST_GRAPH
  };
};

export const receiveGraph = (graph: IGraph) => {
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

const instanceLoadFailed = () => {
  return {
    type: ActionType.INSTANCE_LOAD_ERROR
  };
};

export const receiveInstanceDetails = (instanceDetails: IInstanceDetails) => {
  return {
    payload: instanceDetails,
    type: ActionType.RECEIVE_INSTANCE_DETAILS
  };
};

/** Async actions: https://redux.js.org/advanced/asyncactions */

export const fetchInstances = () => {
  return (dispatch: Dispatch) => {
    dispatch(requestInstances());
    return getFromApi("instances")
      .then(instances => dispatch(receiveInstances(instances)))
      .catch(e => dispatch(graphLoadFailed()));
  };
};

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
      .catch(e => dispatch(instanceLoadFailed()));
  };
};

export const fetchGraph = () => {
  return (dispatch: Dispatch) => {
    dispatch(requestGraph());
    return getFromApi("graph")
      .then(graph => dispatch(receiveGraph(graph)))
      .catch(e => dispatch(graphLoadFailed()));
  };
};
