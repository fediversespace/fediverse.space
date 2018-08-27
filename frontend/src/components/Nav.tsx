import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Alignment, Button, Icon, Navbar } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { selectInstance } from '../redux/actions';
import { IAppState, IInstance } from '../redux/types';
import { InstanceSearch } from './InstanceSearch';

interface INavProps {
    instances?: IInstance[];
    selectInstance: (instance: string) => void;
}

class NavImpl extends React.Component<INavProps> {
    public render() {
        return (
            <Navbar>
            <Navbar.Group align={Alignment.LEFT}>
                <Navbar.Heading>fediverse.space</Navbar.Heading>
                <Button
                    icon={<Icon icon={IconNames.GLOBE_NETWORK} />}
                    text="Network"
                    minimal={true}
                />
                <Button
                    icon={<Icon icon={IconNames.GLOBE} />}
                    text="Map"
                    minimal={true}
                />
            </Navbar.Group>
            <Navbar.Group align={Alignment.RIGHT}>
                <InstanceSearch />
            </Navbar.Group>
            </Navbar>
        )
    } 
}

const mapStateToProps = (state: IAppState) => ({
    instances: state.data.instances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
    selectInstance: (instanceName: string) => dispatch(selectInstance(instanceName)),
})
export const Nav = connect(mapStateToProps, mapDispatchToProps)(NavImpl)