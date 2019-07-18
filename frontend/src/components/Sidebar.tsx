import { orderBy } from "lodash";
import moment from "moment";
import * as numeral from "numeral";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import sanitize from "sanitize-html";

import {
  AnchorButton,
  Button,
  Card,
  Classes,
  Code,
  Divider,
  Elevation,
  H2,
  H4,
  HTMLTable,
  Icon,
  NonIdealState,
  Position,
  Tab,
  Tabs,
  Tooltip
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { selectAndLoadInstance } from "../redux/actions";
import { IAppState, IGraph, IInstanceDetails } from "../redux/types";
import { ErrorState } from "./ErrorState";

interface ISidebarProps {
  graph?: IGraph;
  instanceName: string | null;
  instanceLoadError: boolean;
  instanceDetails: IInstanceDetails | null;
  isLoadingInstanceDetails: boolean;
  selectAndLoadInstance: (instanceName: string) => void;
}
interface ISidebarState {
  isOpen: boolean;
}
class SidebarImpl extends React.Component<ISidebarProps, ISidebarState> {
  constructor(props: ISidebarProps) {
    super(props);
    const isOpen = window.innerWidth >= 900 ? true : false;
    this.state = { isOpen };
  }

  public render() {
    const closedClass = this.state.isOpen ? "" : " closed";
    const buttonIcon = this.state.isOpen ? IconNames.DOUBLE_CHEVRON_RIGHT : IconNames.DOUBLE_CHEVRON_LEFT;
    return (
      <div>
        <Button
          onClick={this.handleToggle}
          large={true}
          icon={buttonIcon}
          className={"fediverse-sidebar-toggle-button" + closedClass}
          minimal={true}
        />
        <Card className={"fediverse-sidebar" + closedClass} elevation={Elevation.TWO}>
          {this.renderSidebarContents()}
        </Card>
      </div>
    );
  }

  private handleToggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  private renderSidebarContents = () => {
    if (this.props.isLoadingInstanceDetails) {
      return this.renderLoadingState();
    } else if (!this.props.instanceDetails) {
      return this.renderEmptyState();
    } else if (this.props.instanceDetails.status.toLowerCase().indexOf("personalinstance") > -1) {
      return this.renderPersonalInstanceErrorState();
    } else if (this.props.instanceDetails.status !== "success") {
      return this.renderMissingDataState();
    } else if (this.props.instanceLoadError) {
      return <ErrorState />;
    } else if (
      this.props.graph &&
      this.props.instanceName &&
      this.props.graph.nodes.map(n => n.data.id).indexOf(this.props.instanceName) < 0
    ) {
      return this.renderQuietInstanceState();
    }
    return (
      <div>
        {this.renderHeading()}
        <Tabs>
          {this.props.instanceDetails.description && (
            <Tab id="description" title="Description" panel={this.renderDescription()} />
          )}
          {this.shouldRenderStats() && <Tab id="stats" title="Details" panel={this.renderVersionAndCounts()} />}
          <Tab id="neighbors" title="Neighbors" panel={this.renderNeighbors()} />
          <Tab id="peers" title="Known peers" panel={this.renderPeers()} />
        </Tabs>
      </div>
    );
  };

  private shouldRenderStats = () => {
    const details = this.props.instanceDetails;
    return details && (details.version || details.userCount || details.statusCount || details.domainCount);
  };

  private renderHeading = () => {
    let content: JSX.Element;
    if (!this.props.instanceName) {
      content = <span>{"No instance selected"}</span>;
    } else {
      content = (
        <span>
          {this.props.instanceName + "  "}
          <Tooltip content="Open link in new tab" position={Position.TOP} className={Classes.DARK}>
            <AnchorButton icon={IconNames.LINK} minimal={true} onClick={this.openInstanceLink} />
          </Tooltip>
        </span>
      );
    }
    return (
      <div>
        <H2>{content}</H2>
        <Divider />
      </div>
    );
  };

  private renderDescription = () => {
    const description = this.props.instanceDetails!.description;
    if (!description) {
      return;
    }
    return <p className={Classes.RUNNING_TEXT} dangerouslySetInnerHTML={{ __html: sanitize(description) }} />;
  };

  private renderVersionAndCounts = () => {
    if (!this.props.instanceDetails) {
      throw new Error("Did not receive instance details as expected!");
    }
    const { version, userCount, statusCount, domainCount, lastUpdated, insularity } = this.props.instanceDetails;
    return (
      <div>
        <HTMLTable small={true} striped={true} className="fediverse-sidebar-table">
          <tbody>
            <tr>
              <td>Version</td>
              <td>{<Code>{version}</Code> || "Unknown"}</td>
            </tr>
            <tr>
              <td>Users</td>
              <td>{(userCount && numeral.default(userCount).format("0,0")) || "Unknown"}</td>
            </tr>
            <tr>
              <td>Statuses</td>
              <td>{(statusCount && numeral.default(statusCount).format("0,0")) || "Unknown"}</td>
            </tr>
            <tr>
              <td>
                Insularity{" "}
                <Tooltip
                  content={
                    <span>
                      The percentage of mentions that are directed
                      <br />
                      toward users on the same instance.
                    </span>
                  }
                  position={Position.TOP}
                  className={Classes.DARK}
                >
                  <Icon icon={IconNames.HELP} iconSize={Icon.SIZE_STANDARD} />
                </Tooltip>
              </td>
              <td>{(insularity && numeral.default(insularity).format("0.0%")) || "Unknown"}</td>
            </tr>
            <tr>
              <td>Known peers</td>
              <td>{(domainCount && numeral.default(domainCount).format("0,0")) || "Unknown"}</td>
            </tr>
            <tr>
              <td>Last updated</td>
              <td>{moment(lastUpdated + "Z").fromNow() || "Unknown"}</td>
            </tr>
          </tbody>
        </HTMLTable>
      </div>
    );
  };

  private renderNeighbors = () => {
    if (!this.props.graph || !this.props.instanceName) {
      return;
    }
    const edges = this.props.graph.edges.filter(
      e => [e.data.source, e.data.target].indexOf(this.props.instanceName!) > -1
    );
    const neighbors: any[] = [];
    edges.forEach(e => {
      if (e.data.source === this.props.instanceName) {
        neighbors.push({ neighbor: e.data.target, weight: e.data.weight });
      } else {
        neighbors.push({ neighbor: e.data.source, weight: e.data.weight });
      }
    });
    const neighborRows = orderBy(neighbors, ["weight"], ["desc"]).map((neighborDetails: any, idx: number) => (
      <tr key={idx}>
        <td>
          <AnchorButton minimal={true} onClick={this.selectInstance}>
            {neighborDetails.neighbor}
          </AnchorButton>
        </td>
        <td>{neighborDetails.weight.toFixed(4)}</td>
      </tr>
    ));
    return (
      <div>
        <p className={Classes.TEXT_MUTED}>
          The mention ratio is the average of how many times the two instances mention each other per status. A mention
          ratio of 1 would mean that every single status contained a mention of a user on the other instance.
        </p>
        <HTMLTable small={true} striped={true} interactive={false} className="fediverse-sidebar-table">
          <thead>
            <tr>
              <th>Instance</th>
              <th>Mention ratio</th>
            </tr>
          </thead>
          <tbody>{neighborRows}</tbody>
        </HTMLTable>
      </div>
    );
  };

  private renderPeers = () => {
    const peers = this.props.instanceDetails!.peers;
    if (!peers || peers.length === 0) {
      return;
    }
    const peerRows = peers.map(instance => (
      <tr key={instance.name} onClick={this.selectInstance}>
        <td>
          <AnchorButton minimal={true} onClick={this.selectInstance}>
            {instance.name}
          </AnchorButton>
        </td>
      </tr>
    ));
    return (
      <div>
        <p className={Classes.TEXT_MUTED}>
          All the instances, past and present, that {this.props.instanceName} knows about.
        </p>
        <HTMLTable small={true} striped={true} interactive={false} className="fediverse-sidebar-table">
          <tbody>{peerRows}</tbody>
        </HTMLTable>
      </div>
    );
  };

  private renderEmptyState = () => {
    return (
      <NonIdealState
        icon={IconNames.CIRCLE}
        title="No instance selected"
        description="Select an instance from the graph or the top-right dropdown to see its details."
      />
    );
  };

  private renderLoadingState = () => {
    return (
      <div>
        <H4>
          <span className={Classes.SKELETON}>Description</span>
        </H4>
        <p className={Classes.SKELETON}>
          Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt. Cupiditate sit
          voluptates quia nulla et saepe id suscipit. Voluptas sed rerum placeat consectetur pariatur necessitatibus
          tempora. Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt.
          Cupiditate sit voluptates quia nulla et saepe id suscipit. Voluptas sed rerum placeat consectetur pariatur
          necessitatibus tempora.
        </p>
        <H4>
          <span className={Classes.SKELETON}>Version</span>
        </H4>
        <p className={Classes.SKELETON}>Eaque rerum sequi unde omnis voluptatibus non quia fugit.</p>
        <H4>
          <span className={Classes.SKELETON}>Stats</span>
        </H4>
        <p className={Classes.SKELETON}>
          Eaque rerum sequi unde omnis voluptatibus non quia fugit. Dignissimos asperiores aut incidunt. Cupiditate sit
          voluptates quia nulla et saepe id suscipit. Eaque rerum sequi unde omnis voluptatibus non quia fugit.
          Dignissimos asperiores aut incidunt. Cupiditate sit voluptates quia nulla et saepe id suscipit.
        </p>
      </div>
    );
  };

  private renderPersonalInstanceErrorState = () => {
    return (
      <NonIdealState
        icon={IconNames.BLOCKED_PERSON}
        title="No data"
        description="This instance has fewer than 10 users. It was not crawled in order to protect their privacy, but if it's your instance you can opt in."
        action={
          <AnchorButton icon={IconNames.CONFIRM} href="https://cursed.technology/@tao" target="_blank">
            Message @tao to opt in
          </AnchorButton>
        }
      />
    );
  };

  private renderMissingDataState = () => {
    return (
      <NonIdealState
        icon={IconNames.ERROR}
        title="No data"
        description="This instance could not be crawled. Either it was down or it's an instance type we don't support yet."
      />
    );
  };

  private renderQuietInstanceState = () => {
    return (
      <NonIdealState
        icon={IconNames.CLEAN}
        title="No interactions"
        description="Users on this instance have not publicly interacted with any other instances recently. "
      />
    );
  };

  private openInstanceLink = () => {
    window.open("https://" + this.props.instanceName, "_blank");
  };

  private selectInstance = (e: any) => {
    this.props.selectAndLoadInstance(e.target.innerText);
  };
}

const mapStateToProps = (state: IAppState) => ({
  graph: state.data.graph,
  instanceDetails: state.currentInstance.currentInstanceDetails,
  instanceLoadError: state.currentInstance.error,
  instanceName: state.currentInstance.currentInstanceName,
  isLoadingInstanceDetails: state.currentInstance.isLoadingInstanceDetails
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  selectAndLoadInstance: (instanceName: string) => dispatch(selectAndLoadInstance(instanceName) as any)
});
export const Sidebar = connect(
  mapStateToProps,
  mapDispatchToProps
)(SidebarImpl);
