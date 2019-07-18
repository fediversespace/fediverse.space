export enum ActionType {
  SELECT_INSTANCE = "SELECT_INSTANCE",
  REQUEST_INSTANCES = "REQUEST_INSTANCES",
  RECEIVE_INSTANCES = "RECEIVE_INSTANCES",
  REQUEST_GRAPH = "REQUEST_GRAPH",
  RECEIVE_GRAPH = "RECEIVE_GRAPH",
  RECEIVE_INSTANCE_DETAILS = "RECEIVE_INSTANCE_DETAILS",
  DESELECT_INSTANCE = "DESELECT_INSTANCE",
  GRAPH_LOAD_ERROR = "GRAPH_LOAD_ERROR",
  INSTANCE_LOAD_ERROR = "INSTANCE_LOAD_ERROR"
}

export interface IAction {
  type: ActionType;
  payload: any;
}

export interface IInstance {
  name: string;
  numUsers?: number;
}

export interface IInstanceDetails {
  name: string;
  peers?: IInstance[];
  description?: string;
  domainCount?: number;
  statusCount?: number;
  userCount?: number;
  version?: string;
  lastUpdated?: string;
  status: string;
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

// Redux state

export interface ICurrentInstanceState {
  currentInstanceDetails: IInstanceDetails | null;
  currentInstanceName: string | null;
  isLoadingInstanceDetails: boolean;
  error: boolean;
}

export interface IDataState {
  instances?: IInstance[];
  graph?: IGraph;
  isLoadingInstances: boolean;
  isLoadingGraph: boolean;
  error: boolean;
}

export interface IAppState {
  currentInstance: ICurrentInstanceState;
  data: IDataState;
}
