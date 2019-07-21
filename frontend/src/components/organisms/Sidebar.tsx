import { orderBy } from "lodash";
import moment from "moment";
import * as numeral from "numeral";
import * as React from "react";
import { connect } from "react-redux";
import sanitize from "sanitize-html";

import {
  AnchorButton,
  Button,
  Callout,
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

import { Link } from "react-router-dom";
import styled from "styled-components";
import { IAppState, IGraph, IInstanceDetails } from "../../redux/types";
import { domainMatchSelector } from "../../util";
import { ErrorState } from "../molecules/";
import { FullDiv } from "../styled-components";

interface IClosedProp {
  closed?: boolean;
}
const SidebarContainer = styled.div<IClosedProp>`
  position: fixed;
  top: 50px;
  bottom: 0;
  right: ${props => (props.closed ? "-400px" : 0)};
  min-width: 400px;
  width: 25%;
  z-index: 20;
  overflow: scroll;
  overflow-x: hidden;
  transition-property: all;
  transition-duration: 0.5s;
  transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
  @media screen and (min-width: 1600px) {
    right: ${props => (props.closed ? "-25%" : 0)};
  }
`;
const StyledCard = styled(Card)`
  min-height: 100%;
  width: 100%;
`;
const StyledButton = styled(Button)`
  position: absolute;
  top: 0;
  left: -40px;
  z-index: 20;
  transition-property: all;
  transition-duration: 0.5s;
  transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
`;
const StyledHTMLTable = styled(HTMLTable)`
  width: 100%;
`;
const StyledLinkToFdNetwork = styled.div`
  margin-top: 3em;
  text-align: center;
`;

interface ISidebarProps {
  graph?: IGraph;
  instanceName: string | null;
  instanceLoadError: boolean;
  instanceDetails: IInstanceDetails | null;
  isLoadingInstanceDetails: boolean;
}
interface ISidebarState {
  isOpen: boolean;
  neighbors?: string[];
  isProcessingNeighbors: boolean;
}
class SidebarImpl extends React.Component<ISidebarProps, ISidebarState> {
  constructor(props: ISidebarProps) {
    super(props);
    const isOpen = window.innerWidth >= 900 ? true : false;
    this.state = { isOpen, isProcessingNeighbors: false };
  }

  public componentDidMount() {
    this.processEdgesToFindNeighbors();
  }

  public componentDidUpdate(prevProps: ISidebarProps, prevState: ISidebarState) {
    if (prevProps.instanceName !== this.props.instanceName) {
      this.processEdgesToFindNeighbors();
    }
  }

  public render() {
    const buttonIcon = this.state.isOpen ? IconNames.DOUBLE_CHEVRON_RIGHT : IconNames.DOUBLE_CHEVRON_LEFT;
    return (
      <SidebarContainer closed={!this.state.isOpen}>
        <StyledButton onClick={this.handleToggle} large={true} icon={buttonIcon} minimal={true} />
        <StyledCard elevation={Elevation.TWO}>{this.renderSidebarContents()}</StyledCard>
      </SidebarContainer>
    );
  }

  private handleToggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  private processEdgesToFindNeighbors = () => {
    const { graph, instanceName } = this.props;
    if (!graph || !instanceName) {
      return;
    }
    this.setState({ isProcessingNeighbors: true });
    const edges = graph.edges.filter(e => [e.data.source, e.data.target].indexOf(instanceName!) > -1);
    const neighbors: any[] = [];
    edges.forEach(e => {
      if (e.data.source === instanceName) {
        neighbors.push({ neighbor: e.data.target, weight: e.data.weight });
      } else {
        neighbors.push({ neighbor: e.data.source, weight: e.data.weight });
      }
    });
    this.setState({ neighbors, isProcessingNeighbors: false });
  };

  private renderSidebarContents = () => {
    let content;
    if (this.props.isLoadingInstanceDetails || this.state.isProcessingNeighbors) {
      content = this.renderLoadingState();
    } else if (!this.props.instanceDetails) {
      return this.renderEmptyState();
    } else if (this.props.instanceDetails.status.toLowerCase().indexOf("personal instance") > -1) {
      content = this.renderPersonalInstanceErrorState();
    } else if (this.props.instanceDetails.status.toLowerCase().indexOf("robots.txt") > -1) {
      content = this.renderRobotsTxtState();
    } else if (this.props.instanceDetails.status !== "success") {
      content = this.renderMissingDataState();
    } else if (this.props.instanceLoadError) {
      return (content = <ErrorState />);
    } else {
      content = this.renderTabs();
    }
    return (
      <FullDiv>
        {this.renderHeading()}
        {content}
      </FullDiv>
    );
  };

  private renderTabs = () => {
    const hasNeighbors = this.state.neighbors && this.state.neighbors.length > 0;

    const insularCallout = hasNeighbors ? (
      undefined
    ) : (
      <Callout icon={IconNames.INFO_SIGN} title="Insular instance">
        <p>This instance doesn't have any neighbors that we know of, so it's hidden from the graph.</p>
      </Callout>
    );
    return (
      <div>
        {insularCallout}
        <Tabs>
          {this.props.instanceDetails!.description && (
            <Tab id="description" title="Description" panel={this.renderDescription()} />
          )}
          {this.shouldRenderStats() && <Tab id="stats" title="Details" panel={this.renderVersionAndCounts()} />}
          <Tab id="neighbors" title="Neighbors" panel={this.renderNeighbors()} />
          <Tab id="peers" title="Known peers" panel={this.renderPeers()} />
        </Tabs>
        <StyledLinkToFdNetwork>
          <a
            href={`https://fediverse.network/${this.props.instanceName}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${Classes.BUTTON} bp3-icon-${IconNames.LINK}`}
          >
            See more statistics at fediverse.network
          </a>
        </StyledLinkToFdNetwork>
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
      return;
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
        <StyledHTMLTable small={true} striped={true}>
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
        </StyledHTMLTable>
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
          <Link
            to={`/instance/${neighborDetails.neighbor}`}
            className={`${Classes.BUTTON} ${Classes.MINIMAL}`}
            role="button"
          >
            {neighborDetails.neighbor}
          </Link>
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
        <StyledHTMLTable small={true} striped={true} interactive={false}>
          <thead>
            <tr>
              <th>Instance</th>
              <th>Mention ratio</th>
            </tr>
          </thead>
          <tbody>{neighborRows}</tbody>
        </StyledHTMLTable>
      </div>
    );
  };

  private renderPeers = () => {
    const peers = this.props.instanceDetails!.peers;
    if (!peers || peers.length === 0) {
      return;
    }
    const peerRows = peers.map(instance => (
      <tr key={instance.name}>
        <td>
          <Link to={`/instance/${instance.name}`} className={`${Classes.BUTTON} ${Classes.MINIMAL}`} role="button">
            {instance.name}
          </Link>
        </td>
      </tr>
    ));
    return (
      <div>
        <p className={Classes.TEXT_MUTED}>
          All the instances, past and present, that {this.props.instanceName} knows about.
        </p>
        <StyledHTMLTable small={true} striped={true} interactive={false} className="fediverse-sidebar-table">
          <tbody>{peerRows}</tbody>
        </StyledHTMLTable>
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
          <AnchorButton icon={IconNames.CONFIRM} href="https://cursed.technology/@fediversespace" target="_blank">
            Message @fediversespace to opt in
          </AnchorButton>
        }
      />
    );
  };

  private renderMissingDataState = () => {
    return (
      <FullDiv>
        <NonIdealState
          icon={IconNames.ERROR}
          title="No data"
          description="This instance could not be crawled. Either it was down or it's an instance type we don't support yet."
        />
        <span className="sidebar-hidden-instance-status" style={{ display: "none" }}>
          {this.props.instanceDetails && this.props.instanceDetails.status}
        </span>
      </FullDiv>
    );
  };

  private renderRobotsTxtState = () => {
    return (
      <NonIdealState
        icon={
          <span role="img" aria-label="robot">
            🤖
          </span>
        }
        title="No data"
        description="This instance was not crawled because its robots.txt did not allow us to."
      />
    );
  };

  private openInstanceLink = () => {
    window.open("https://" + this.props.instanceName, "_blank");
  };
}

const mapStateToProps = (state: IAppState) => {
  const match = domainMatchSelector(state);
  return {
    graph: state.data.graph,
    instanceDetails: state.currentInstance.currentInstanceDetails,
    instanceLoadError: state.currentInstance.error,
    instanceName: match && match.params.domain,
    isLoadingInstanceDetails: state.currentInstance.isLoadingInstanceDetails
  };
};
const Sidebar = connect(mapStateToProps)(SidebarImpl);
export default Sidebar;