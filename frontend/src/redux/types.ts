export enum ActionType {
    SELECT_INSTANCE = 'SELECT_INSTANCE',
    REQUEST_INSTANCES = 'REQUEST_INSTANCES',
    RECEIVE_INSTANCES = 'RECEIVE_INSTANCES',
    REQUEST_GRAPH = 'REQUEST_GRAPH',
    RECEIVE_GRAPH = 'RECEIVE_GRAPH',
}

export interface IAction {
    type: ActionType,
    payload: any,
}

export interface IInstance {
    name: string,
    numUsers?: number,
}

interface IGraphNode {
    id: string;
    label: string;
    size?: number;
    color?: string;
}

interface IGraphEdge {
    source: string;
    target: string;
    id?: string;
}

export interface IGraph {
    nodes: IGraphNode[];
    edges: IGraphEdge[];
}

// Redux state

export interface IDataState {
    instances?: IInstance[],
    graph?: IGraph,
    isLoadingInstances: boolean,
    isLoadingGraph: boolean,
}

export interface IAppState {
    currentInstanceName: string | null,
    data: IDataState,
}