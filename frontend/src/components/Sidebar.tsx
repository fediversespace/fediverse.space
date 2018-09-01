import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import * as sanitize from 'sanitize-html';

import { Card, Classes, Divider, Elevation, HTMLTable, NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { selectAndLoadInstance } from '../redux/actions';
import { IAppState, IInstanceDetails } from '../redux/types';

interface ISidebarProps {
    instanceName: string | null,
    instanceDetails: IInstanceDetails | null,
    isLoadingInstanceDetails: boolean;
    selectAndLoadInstance: (instanceName: string) => void;
}
class SidebarImpl extends React.Component<ISidebarProps> {
    public render() {
        return (
            <Card className="fediverse-sidebar" elevation={Elevation.TWO}>
                {this.renderSidebarContents()}
            </Card>
        )
    }

    private renderSidebarContents = () => {
        if (this.props.isLoadingInstanceDetails) {
            return this.renderLoadingState();
        } else if (!this.props.instanceDetails) {
            return this.renderEmptyState();
        }
        return (
            <div>
                <h2>{this.props.instanceName || "No instance selected"}</h2>
                <Divider />
                {this.renderDescription()}
                {this.renderVersion()}
                {this.renderCounts()}
                {this.renderPeers()}
            </div>
        );
    }

    private renderDescription = () => {
        const description = this.props.instanceDetails!.description;
        if (!description) {
            return;
        }
        return (
            <div>
                <h4>Description</h4>
                <div className={Classes.RUNNING_TEXT} dangerouslySetInnerHTML={{__html: sanitize(description)}} />
                <Divider />
            </div>
        )
    }

    private renderVersion = () => {
        const version = this.props.instanceDetails!.version;
        if (!version) {
            return;
        }
        return (
            <div>
                <h4>Version</h4>
                    <code className={Classes.CODE}>{version}</code>
                <Divider />
            </div>
        )
    }

    private renderCounts = () => {
        const userCount = this.props.instanceDetails!.userCount;
        const statusCount = this.props.instanceDetails!.statusCount;
        const domainCount = this.props.instanceDetails!.domainCount;
        if (!userCount && !statusCount && !domainCount) {
            return;
        }
        return (
            <div>
                <h4>Stats</h4>
                <HTMLTable small={true} striped={true} className="fediverse-sidebar-table">
                    <tbody>
                        <tr>
                            <td>Users</td>
                            <td>{userCount || "Unknown"}</td>
                        </tr>
                        <tr>
                            <td>Statuses</td>
                            <td>{statusCount || "Unknown"}</td>
                        </tr>
                        <tr>
                            <td>Known peers</td>
                            <td>{domainCount || "Unknown"}</td>
                        </tr>
                    </tbody>
                </HTMLTable>
                <Divider />
            </div>
        )
    }

    private renderPeers = () => {
        const peers = this.props.instanceDetails!.peers;
        if (!peers) {
            return;
        }
        const peerRows = peers.map(instance => (
            <tr key={instance.name} onClick={this.selectInstance}>
                <td>{instance.name}</td>
            </tr>
        ));
        return (
            <div>
                <h4>Known instances</h4>
                <HTMLTable small={true} striped={true} interactive={true} className="fediverse-sidebar-table">
                    <tbody>
                        {peerRows}
                    </tbody>
                </HTMLTable>
            </div>
        )
    }

    private renderEmptyState = () => {
        return (
            <NonIdealState
                icon={IconNames.CIRCLE}
                title="No instance selected"
                description="Select an instance from the graph or the top-right dropdown to see its details."
            />
        )
    }

    private renderLoadingState = () => {
        return (
            <div>
                <h4><span className={Classes.SKELETON}>Description</span></h4>
                <p className={Classes.SKELETON}>
                    Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt.
                    Cupiditate sit voluptates quia nulla et saepe id suscipit.
                    Voluptas sed rerum placeat consectetur pariatur necessitatibus tempora.
                    Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt.
                    Cupiditate sit voluptates quia nulla et saepe id suscipit.
                    Voluptas sed rerum placeat consectetur pariatur necessitatibus tempora.
                </p>
                <h4><span className={Classes.SKELETON}>Version</span></h4>
                <p className={Classes.SKELETON}>
                    Eaque rerum sequi unde omnis voluptatibus non quia fugit.
                </p>
                <h4><span className={Classes.SKELETON}>Stats</span></h4>
                <p className={Classes.SKELETON}>
                    Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt.
                    Cupiditate sit voluptates quia nulla et saepe id suscipit.
                    Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt.
                    Cupiditate sit voluptates quia nulla et saepe id suscipit.
                </p>
            </div>
        );
    }

    private selectInstance = (e: any)=> {
        this.props.selectAndLoadInstance(e.target.innerText);
    }
}

const mapStateToProps = (state: IAppState) => ({
    instanceDetails: state.currentInstance.currentInstanceDetails,
    instanceName: state.currentInstance.currentInstanceName,
    isLoadingInstanceDetails: state.currentInstance.isLoadingInstanceDetails,
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
    selectAndLoadInstance: (instanceName: string) => dispatch(selectAndLoadInstance(instanceName) as any),
});
export const Sidebar = connect(mapStateToProps, mapDispatchToProps)(SidebarImpl);
