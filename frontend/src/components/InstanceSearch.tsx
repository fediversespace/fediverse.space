import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Button, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { IItemRendererProps, ItemPredicate, Select } from '@blueprintjs/select';

import { selectAndLoadInstance } from '../redux/actions';
import { IAppState, IInstance } from '../redux/types';

interface IInstanceSearchProps {
    currentInstanceName: string | null;
    instances?: IInstance[];
    selectAndLoadInstance: (instanceName: string) => void;
}

const InstanceSelect = Select.ofType<IInstance>();

class InstanceSearchImpl extends React.Component<IInstanceSearchProps> {

    public render() {
        return (
            <InstanceSelect
                items={this.props.instances || []}
                itemRenderer={this.itemRenderer}
                onItemSelect={this.onItemSelect}
                itemPredicate={this.itemPredicate}
                disabled={!this.props.instances}
                initialContent={this.renderInitialContent()}
                noResults={this.renderNoResults()}
                popoverProps={{popoverClassName: "fediverse-instance-search-popover"}}
            >
                <Button
                    icon={IconNames.SELECTION}
                    rightIcon={IconNames.CARET_DOWN}
                    text={this.props.currentInstanceName || ("Select an instance")}
                    disabled={!this.props.instances}
                />
            </InstanceSelect>
        );
    }

    private renderInitialContent = () => {
        return (
            <MenuItem disabled={true} text={"Start typing"} />
        );
    }

    private renderNoResults = () => {
        return (
            <MenuItem disabled={true} text={"Keep typing"} />
        );
    }

    private itemRenderer = (item: IInstance, itemProps: IItemRendererProps)  => {
        if (!itemProps.modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem
                text={item.name}
                key={item.name}
                active={itemProps.modifiers.active}
                onClick={itemProps.handleClick}
            />
        );
    }

    private itemPredicate: ItemPredicate<IInstance> = (query, item, index) => {
        if (!item.name || query.length < 4) {
            return false;
        }
        return item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
    }

    private onItemSelect = (item: IInstance, event?: React.SyntheticEvent<HTMLElement>) => {
        this.props.selectAndLoadInstance(item.name);
    }
}

const mapStateToProps = (state: IAppState) => ({
    currentInstanceName: state.currentInstance.currentInstanceName,
    instances: state.data.instances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
    selectAndLoadInstance: (instanceName: string) => dispatch(selectAndLoadInstance(instanceName) as any),
})
export const InstanceSearch = connect(mapStateToProps, mapDispatchToProps)(InstanceSearchImpl)
