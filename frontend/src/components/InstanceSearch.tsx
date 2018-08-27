import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { MenuItem } from '@blueprintjs/core';
import { IItemRendererProps, Suggest } from '@blueprintjs/select';

import { selectInstance } from '../redux/actions';
import { IAppState, IInstance } from '../redux/types';

interface IInstanceSearchProps {
    currentInstance: IInstance;
    instances?: IInstance[];
    selectInstance: (instanceName: string) => void;
}

class InstanceSearchImpl extends React.Component<IInstanceSearchProps> {

    public render() {
        return (
            <Suggest
                inputValueRenderer={this.inputValueRenderer}
                itemRenderer={this.itemRenderer}
                items={this.props.instances || []}
                onItemSelect={this.onItemSelect}
                // itemListRenderer={this.itemListRenderer}
            />
        )
    }

    private inputValueRenderer = (item: IInstance): string => {
        return item.name;
    }

    private itemRenderer = (item: IInstance, itemProps: IItemRendererProps): JSX.Element => {
        return <MenuItem label={item.name} key={item.name} />;
    }

    private onItemSelect = (item: IInstance, event?: React.SyntheticEvent<HTMLElement>) => {
        this.props.selectInstance(item.name);
    }

    // private itemListRenderer = (itemListProps: IItemListRendererProps<IInstance>): JSX.Element => {
    //     return (
    //         <List
    //             height={350}
    //             rowHeight={30}
    //             rowCount={(this.props.instances && this.props.instances.length) || 0}
    //             // tslint:disable-next-line
    //             rowRenderer={this.rowRenderer}
    //             width={214}
    //         />
    //     )
    // }

    // private rowRenderer = (listRowProps: ListRowProps) => {
    //     const instanceName = (this.props.instances && this.props.instances[listRowProps.index].name) || "";
    //     return <MenuItem label={instanceName} key={instanceName} />;
    // }
}

const mapStateToProps = (state: IAppState) => ({
    currentInstance: state.currentInstance,
    instances: state.data.instances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
    selectInstance: (instanceName: string) => dispatch(selectInstance(instanceName)),
})
export const InstanceSearch = connect(mapStateToProps, mapDispatchToProps)(InstanceSearchImpl)
