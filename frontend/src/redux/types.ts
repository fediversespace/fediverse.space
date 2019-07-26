import { RouterState } from "connected-react-router";

export enum ActionType {
  // Instance details
  REQUEST_INSTANCE_DETAILS = "REQUEST_INSTANCE_DETAILS",
  RECEIVE_INSTANCE_DETAILS = "RECEIVE_INSTANCE_DETAILS",
  INSTANCE_LOAD_ERROR = "INSTANCE_LOAD_ERROR",
  // Graph
  REQUEST_GRAPH = "REQUEST_GRAPH",
  RECEIVE_GRAPH = "RECEIVE_GRAPH",
  GRAPH_LOAD_ERROR = "GRAPH_LOAD_ERROR",
  // Nav
  DESELECT_INSTANCE = "DESELECT_INSTANCE",
  // Search
  REQUEST_SEARCH_RESULTS = "REQUEST_SEARCH_RESULTS",
  RECEIVE_SEARCH_RESULTS = "RECEIVE_SEARCH_RESULTS",
  SEARCH_RESULTS_ERROR = "SEARCH_RESULTS_ERROR",
  RESET_SEARCH = "RESET_SEARCH",
  // Search -- hovering over results
  SET_SEARCH_RESULT_HOVER = "SET_SEARCH_RESULT_HOVER"
}

export interface IAction {
  type: ActionType;
  payload: any;
}

export interface IInstance {
  name: string;
}

export interface ISearchResultInstance {
  name: string;
  description?: string;
  userCount?: number;
  type?: string;
}

export interface IInstanceDetails {
  name: string;
  description?: string;
  version?: string;
  userCount?: number;
  insularity?: number;
  statusCount?: number;
  domainCount?: number;
  peers?: IInstance[];
  lastUpdated?: string;
  status: string;
  type?: string;
}

interface IGraphNode {
  data: {
    id: string;
    label: string;
    size: number;
  };
  position: {
    x: number;
    y: number;
  };
}

interface IGraphEdge {
  data: {
    source: string;
    target: string;
    id: string;
    weight: number;
  };
}

export interface IGraph {
  nodes: IGraphNode[];
  edges: IGraphEdge[];
}

export interface ISearchResponse {
  results: ISearchResultInstance[];
  next: string | null;
}

// Redux state

// The current instance name is stored in the URL. See state -> router -> location
export interface ICurrentInstanceState {
  currentInstanceDetails: IInstanceDetails | null;
  isLoadingInstanceDetails: boolean;
  error: boolean;
}

export interface IDataState {
  graph?: IGraph;
  isLoadingGraph: boolean;
  error: boolean;
}

export interface ISearchState {
  error: boolean;
  isLoadingResults: boolean;
  next: string;
  query: string;
  results: ISearchResultInstance[];
  hoveringOverResult?: string;
}

export interface IAppState {
  router: RouterState;
  currentInstance: ICurrentInstanceState;
  data: IDataState;
  search: ISearchState;
}
