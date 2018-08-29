export enum ActionType {
    SELECT_INSTANCE = 'SELECT_INSTANCE',
    REQUEST_INSTANCES = 'REQUEST_INSTANCES',
    RECEIVE_INSTANCES = 'RECEIVE_INSTANCES',
}

export interface IAction {
    type: ActionType,
    payload: any,
}

export interface IInstance {
    name: string,
    numUsers?: number,
}

export interface IDataState {
    instances?: IInstance[],
    isLoadingInstances: boolean,
}

export interface IAppState {
    currentInstanceName: string | null,
    data: IDataState,
}
