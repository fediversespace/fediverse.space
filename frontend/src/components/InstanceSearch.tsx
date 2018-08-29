import * as React from 'react';
import { connect } from 'react-redux';
// import { List, ListRowProps } from 'react-virtualized';
import { Dispatch } from 'redux';

import { Button, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select';

import { selectInstance } from '../redux/actions';
import { IAppState, IInstance } from '../redux/types';

interface IInstanceSearchProps {
    currentInstance: IInstance | null;
    instances?: IInstance[];
    selectInstance: (instanceName: string) => void;
}

const InstanceSelect = Select.ofType<IInstance>();

class InstanceSearchImpl extends React.Component<IInstanceSearchProps> {

    public render() {
        return (
            <InstanceSelect
                items={this.props.instances && this.props.instances.slice(50) || []}
                itemRenderer={this.itemRenderer}
                onItemSelect={this.onItemSelect}
                itemPredicate={this.itemPredicate}
                disabled={!this.props.instances}
            >
                <Button
                    icon={IconNames.SELECTION}
                    rightIcon={IconNames.CARET_DOWN}
                    text={(this.props.currentInstance && this.props.currentInstance.name) || ("Select an instance")}
                    disabled={!this.props.instances}
                />
            </InstanceSelect>
        );
    }

    private itemRenderer: ItemRenderer<IInstance> = (item, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem
                text={item.name}
                key={item.name}
                active={modifiers.active}
                onClick={handleClick}
            />
        );
    }

    private itemPredicate: ItemPredicate<IInstance> = (query, item, index) => {
        if (!item.name) {
            return false;
        }
        return item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
    }

    private onItemSelect = (item: IInstance, event?: React.SyntheticEvent<HTMLElement>) => {
        this.props.selectInstance(item.name);
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
