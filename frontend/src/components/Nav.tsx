import * as React from 'react';

import { Alignment, Button, Icon, Navbar } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { InstanceSearch } from './InstanceSearch';

export class Nav extends React.Component {
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
