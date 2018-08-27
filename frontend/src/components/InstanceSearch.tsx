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
        // TODO: make prettier when no instances loaded
        if (!this.props.instances) {
            return (
                <Suggest
                    items={[]}
                    inputValueRenderer={this.inputValueRenderer}
                    itemRenderer={this.itemRenderer}
                    onItemSelect={this.onItemSelect}
                    popoverProps={{minimal: true}}
                />
            )
        }
        return (
            <Suggest
                items={this.props.instances!.map(i => i.name)}
                inputValueRenderer={this.inputValueRenderer}
                itemRenderer={this.itemRenderer}
                onItemSelect={this.onItemSelect}
                popoverProps={{minimal: true}}
            />
        )
    }

    private inputValueRenderer = (item: string) => {
        return item;
    }

    private itemRenderer = (item: string, itemProps: IItemRendererProps) => {
        return <MenuItem text={item} />;
    }

    private onItemSelect = (item: string) => {
        return;
    }
}

const mapStateToProps = (state: IAppState) => ({
    currentInstance: state.currentInstance,
    instances: state.data.instances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
    selectInstance: (instanceName: string) => dispatch(selectInstance(instanceName)),
})
export const InstanceSearch = connect(mapStateToProps, mapDispatchToProps)(InstanceSearchImpl)
