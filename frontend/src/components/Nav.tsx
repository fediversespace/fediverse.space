import * as React from 'react';

import { Alignment, Button, Classes, Dialog, Icon, Navbar } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { InstanceSearch } from './InstanceSearch';

interface INavState {
    aboutIsOpen: boolean;
}
export class Nav extends React.Component<{}, INavState> {

    constructor(props: any) {
        super(props);
        this.state = {aboutIsOpen: false};
    }

    public render() {
        return (
            <Navbar fixedToTop={true}>
            <Navbar.Group align={Alignment.LEFT}>
                <Navbar.Heading>
                    <Icon
                        icon={IconNames.GLOBE_NETWORK}
                        iconSize={Icon.SIZE_LARGE}
                        className="fediverse-heading-icon"
                    />
                    fediverse.space
                </Navbar.Heading>
                <Navbar.Divider />
                <Button
                    icon={IconNames.INFO_SIGN}
                    text="About"
                    minimal={true}
                    onClick={this.handleAboutOpen}
                />
                {this.renderAboutDialog()}
                {/* <Button
                    icon={<Icon icon={IconNames.GLOBE_NETWORK} />}
                    text="Network"
                    minimal={true}
                />
                <Button
                    icon={<Icon icon={IconNames.GLOBE} />}
                    text="Map"
                    minimal={true}
                /> */}
            </Navbar.Group>
            <Navbar.Group align={Alignment.RIGHT}>
                <InstanceSearch />
            </Navbar.Group>
            </Navbar>
        )
    }

    private renderAboutDialog = () => {
        return (
            <Dialog
                icon={IconNames.INFO_SIGN}
                title="About"
                onClose={this.handleAboutClose}
                isOpen={this.state.aboutIsOpen}
                className={Classes.DARK + ' fediverse-about-dialog'}
            >
                <div className={Classes.DIALOG_BODY}>
                    <p className={Classes.RUNNING_TEXT}>
                        fediverse.space is a tool to visualize networks and communities on the 
                        {' '}<a href="https://en.wikipedia.org/wiki/Fediverse" target="_blank">fediverse</a>.
                        It works by scraping every instance it can find and aggregating statistics on communication
                        between these.
                    </p>

                    <h2>FAQ</h2>
                    <h4>Why can't I see details about my instance?</h4>
                    <p className={Classes.RUNNING_TEXT}>
                        Currently, fediverse.space only supports Mastodon and Pleroma instances. In addition, instances
                        with 5 or fewer users won't be scraped -- it's a tool for understanding communities, not
                        individuals.
                    </p>
                    <h4>How do you calculate the strength of relationships between instances?</h4>
                    <p className={Classes.RUNNING_TEXT}>
                        fediverse.space scrapes the last 5000 statuses from within the last month on the public
                        timeline of each instance. It looks at the ratio of
                        <code>mentions of an instance / total statuses</code>.
                        It uses a ratio rather than an absolute number of mentions to reflect that smaller instances
                        can play a large role in a community.
                    </p>

                    <h2>Credits</h2>
                    <p className={Classes.RUNNING_TEXT}>
                        This site is inspired by several other sites in the same vein:
                        <ul className={Classes.LIST}>
                            <li><a href="https://the-federation.info/" target="_blank">the-federation.info</a></li>
                            <li><a href="http://fediverse.network/" target="_blank">fediverse.network</a></li>
                            <li>
                                <a
                                    href="https://lucahammer.at/vis/fediverse/2018-08-30-mastoverse_hashtags/"
                                    target="_blank"
                                >
                                    Mastodon hashtag network
                                </a>
                                {' by '}
                                <a href="https://vis.social/web/statuses/100634284168959187" target="_blank">
                                    @Luca@vis.social
                                </a>
                            </li>
                        </ul>
                        The source code for fediverse.space is available on{' '}
                            <a href="https://gitlab.com/taobojlen/fediverse.space" target="_blank">GitLab</a>;{' '}
                        issues and pull requests are welcome!
                    </p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button
                            icon={IconNames.THUMBS_UP}
                            text="OK!"
                            onClick={this.handleAboutClose}
                        />
                    </div>
                </div>
            </Dialog>
        )
    }

    private handleAboutOpen = () => {
        this.setState({aboutIsOpen: true});
    }

    private handleAboutClose = () => {
        this.setState({aboutIsOpen: false});
    }
}
