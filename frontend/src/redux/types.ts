import { RouterState } from "connected-react-router";
import { SearchFilter } from "../searchFilters";

export enum ActionType {
  // Instance details
  REQUEST_INSTANCE_DETAILS = "REQUEST_INSTANCE_DETAILS",
  RECEIVE_INSTANCE_DETAILS = "RECEIVE_INSTANCE_DETAILS",
  INSTANCE_LOAD_ERROR = "INSTANCE_LOAD_ERROR",
  // Graph
  REQUEST_GRAPH = "REQUEST_GRAPH",
  RECEIVE_GRAPH = "RECEIVE_GRAPH",
  GRAPH_LOAD_ERROR = "GRAPH_LOAD_ERROR",
  // Instance list
  REQUEST_INSTANCES = "REQUEST_INSTANCES",
  RECEIVE_INSTANCES = "RECEIVE_INSTANCES",
  INSTANCE_LIST_LOAD_ERROR = "INSTANCE_LIST_LOAD_ERROR",
  // Nav
  DESELECT_INSTANCE = "DESELECT_INSTANCE",
  // Search
  REQUEST_SEARCH_RESULTS = "REQUEST_SEARCH_RESULTS",
  RECEIVE_SEARCH_RESULTS = "RECEIVE_SEARCH_RESULTS",
  SEARCH_RESULTS_ERROR = "SEARCH_RESULTS_ERROR",
  RESET_SEARCH = "RESET_SEARCH",
  // Search -- hovering over results
  SET_SEARCH_RESULT_HOVER = "SET_SEARCH_RESULT_HOVER",
}

export interface Action {
  type: ActionType;
  payload: any;
}

export type SortField = "domain" | "userCount" | "statusCount" | "insularity";
export type SortDirection = "asc" | "desc";
export interface InstanceSort {
  field: SortField;
  direction: SortDirection;
}

export interface Peer {
  name: string;
}

export interface SearchResultInstance {
  name: string;
  description?: string;
  userCount?: number;
  type?: string;
}

export interface FederationRestrictions {
  reportRemoval?: string[];
  reject?: string[];
  mediaRemoval?: string[];
  mediaNsfw?: string[];
  federatedTimelineRemoval?: string[];
  bannerRemoval?: string[];
  avatarRemoval?: string[];
  accept?: string[];
}

export interface InstanceDetails {
  name: string;
  description?: string;
  version?: string;
  userCount?: number;
  insularity?: number;
  statusCount?: number;
  domainCount?: number;
  peers?: Peer[];
  federationRestrictions: FederationRestrictions;
  lastUpdated?: string;
  status: string;
  type?: string;
  statusesPerDay?: number;
  statusesPerUserPerDay?: number;
}

interface GraphNode {
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

interface GraphEdge {
  data: {
    source: string;
    target: string;
    id: string;
    weight: number;
  };
}

interface GraphMetadata {
  ranges: { [key: string]: [number, number] };
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphResponse {
  graph: Graph;
  metadata: GraphMetadata;
}

export interface SearchResponse {
  results: SearchResultInstance[];
  next: string | null;
}

export interface InstanceListResponse {
  pageNumber: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  instances: InstanceDetails[];
}

// Redux state

// The current instance name is stored in the URL. See state -> router -> location
export interface CurrentInstanceState {
  currentInstanceDetails: InstanceDetails | null;
  isLoadingInstanceDetails: boolean;
  error: boolean;
}

export interface DataState {
  graphResponse?: GraphResponse;
  instancesResponse?: InstanceListResponse;
  instanceListSort: InstanceSort;
  isLoadingGraph: boolean;
  isLoadingInstanceList: boolean;
  graphLoadError: boolean;
  instanceListLoadError: boolean;
}

export interface SearchState {
  error: boolean;
  isLoadingResults: boolean;
  next: string;
  query: string;
  results: SearchResultInstance[];
  filters: SearchFilter[];
  hoveringOverResult?: string;
}

export interface AppState {
  router: RouterState;
  currentInstance: CurrentInstanceState;
  data: DataState;
  search: SearchState;
}
