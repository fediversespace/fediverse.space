import { orderBy } from "lodash";
import moment from "moment";
import * as numeral from "numeral";
import React from "react";
import { connect } from "react-redux";
import sanitize from "sanitize-html";

import {
  AnchorButton,
  Button,
  Callout,
  Classes,
  Code,
  Divider,
  H2,
  HTMLTable,
  Icon,
  NonIdealState,
  Position,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { push } from "connected-react-router";
import { Link } from "react-router-dom";
import { Dispatch } from "redux";
import styled from "styled-components";
import { AppState, Graph, GraphResponse, InstanceDetails, Peer } from "../../redux/types";
import { domainMatchSelector, getFromApi, isSmallScreen } from "../../util";
import { InstanceType } from "../atoms";
import { Cytoscape, ErrorState } from "../molecules";
import { FederationTab } from "../organisms";

const InstanceScreenContainer = styled.div`
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
`;
const HeadingContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 0 20px;
`;
const StyledHeadingH2 = styled(H2)`
  margin: 0;
`;
const StyledCloseButton = styled(Button)`
  justify-self: flex-end;
`;
const StyledHeadingTooltip = styled(Tooltip)`
  margin-left: 5px;
  flex-grow: 1;
`;
const StyledHTMLTable = styled(HTMLTable)`
  width: 100%;
`;
const StyledLinkToFdNetwork = styled.div`
  text-align: center;
  margin-top: auto;
`;
const StyledCallout = styled(Callout)`
  margin: 10px 20px;
  width: auto;
`;
const NeighborsCallout = styled(Callout)`
  margin: 10px 0;
  width: auto;
`;
const StyledTabs = (styled as any)(Tabs)`
  width: 100%;
  padding: 0 20px;
`;
const StyledGraphContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;
interface InstanceScreenProps {
  graph?: Graph;
  instanceName: string | null;
  instanceLoadError: boolean;
  instanceDetails: InstanceDetails | null;
  isLoadingInstanceDetails: boolean;
  navigateToRoot: () => void;
  navigateToInstance: (domain: string) => void;
}
interface InstanceScreenState {
  neighbors?: string[];
  isProcessingNeighbors: boolean;
  // Local (neighborhood) graph. Used only on small screens (mobile devices).
  isLoadingLocalGraph: boolean;
  localGraph?: Graph;
  localGraphLoadError?: boolean;
}
class InstanceScreenImpl extends React.PureComponent<InstanceScreenProps, InstanceScreenState> {
  public constructor(props: InstanceScreenProps) {
    super(props);
    this.state = { isProcessingNeighbors: false, isLoadingLocalGraph: false, localGraphLoadError: false };
  }

  public render() {
    let content;
    if (this.props.isLoadingInstanceDetails || this.state.isProcessingNeighbors || this.state.isLoadingLocalGraph) {
      content = this.renderLoadingState();
    } else if (
      this.props.instanceLoadError ||
      this.state.localGraphLoadError ||
      !this.props.instanceDetails ||
      !this.props.instanceDetails.status
    ) {
      content = <ErrorState />;
    } else if (this.props.instanceDetails.status.toLowerCase().includes("personal instance")) {
      content = this.renderPersonalInstanceErrorState();
    } else if (this.props.instanceDetails.status.toLowerCase().includes("robots.txt")) {
      content = this.renderRobotsTxtState();
    } else if (this.props.instanceDetails.status !== "success") {
      content = this.renderMissingDataState();
    } else {
      content = this.renderTabs();
    }
    return (
      <InstanceScreenContainer>
        <HeadingContainer>
          <StyledHeadingH2>{this.props.instanceName}</StyledHeadingH2>
          <StyledHeadingTooltip content="Open link in new tab" position={Position.TOP} className={Classes.DARK}>
            <AnchorButton icon={IconNames.LINK} minimal onClick={this.openInstanceLink} />
          </StyledHeadingTooltip>
          <StyledCloseButton icon={IconNames.CROSS} onClick={this.props.navigateToRoot} />
        </HeadingContainer>
        <Divider />
        {content}
      </InstanceScreenContainer>
    );
  }

  public componentDidMount() {
    this.loadLocalGraphOnSmallScreen();
    this.processEdgesToFindNeighbors();
  }

  public componentDidUpdate(prevProps: InstanceScreenProps, prevState: InstanceScreenState) {
    const isNewInstance = prevProps.instanceName !== this.props.instanceName;
    const receivedNewEdges = !!this.props.graph && !this.state.isProcessingNeighbors && !this.state.neighbors;
    const receivedNewLocalGraph = !!this.state.localGraph && !prevState.localGraph;
    if (isNewInstance || receivedNewEdges || receivedNewLocalGraph) {
      this.processEdgesToFindNeighbors();
    }
  }

  private processEdgesToFindNeighbors = () => {
    // TODO: use cytoscape to replace this method
    // simply cy.$id(nodeId).outgoers() (and/or incomers())
    const { graph, instanceName } = this.props;
    const { localGraph } = this.state;
    if ((!graph && !localGraph) || !instanceName) {
      return;
    }
    this.setState({ isProcessingNeighbors: true });

    const graphToUse = graph || localGraph;
    if (!graphToUse) {
      return;
    }
    const edges = graphToUse.edges.filter((e) => [e.data.source, e.data.target].includes(instanceName));
    const neighbors: any[] = [];
    edges.forEach((e) => {
      if (e.data.source === instanceName) {
        neighbors.push({ neighbor: e.data.target, weight: e.data.weight });
      } else {
        neighbors.push({ neighbor: e.data.source, weight: e.data.weight });
      }
    });
    this.setState({ neighbors, isProcessingNeighbors: false });
  };

  private loadLocalGraphOnSmallScreen = () => {
    if (!isSmallScreen) {
      return;
    }
    this.setState({ isLoadingLocalGraph: true });
    getFromApi(`graph/${this.props.instanceName}`)
      .then((response: GraphResponse) => {
        // We do some processing of edges here to make sure that every edge's source and target are in the neighborhood
        // We could (and should) be doing this in the backend, but I don't want to mess around with complex SQL
        // queries.
        // TODO: think more about moving the backend to a graph database that would make this easier.
        const { graph } = response;
        const nodeIds = new Set(graph.nodes.map((n) => n.data.id));
        const edges = graph.edges.filter((e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target));
        this.setState({ isLoadingLocalGraph: false, localGraph: { ...graph, edges } });
      })
      .catch(() => this.setState({ isLoadingLocalGraph: false, localGraphLoadError: true }));
  };

  private renderTabs = () => {
    const { instanceDetails } = this.props;
    const hasNeighbors = this.state.neighbors && this.state.neighbors.length > 0;
    const federationRestrictions = instanceDetails && instanceDetails.federationRestrictions;

    const hasLocalGraph =
      !!this.state.localGraph && this.state.localGraph.nodes.length > 0 && this.state.localGraph.edges.length > 0;
    const insularCallout =
      this.props.graph && !this.state.isProcessingNeighbors && !hasNeighbors && !hasLocalGraph ? (
        <StyledCallout icon={IconNames.INFO_SIGN} title="Insular instance">
          <p>This instance doesn&apos;t have any neighbors that we know of, so it&apos;s hidden from the graph.</p>
        </StyledCallout>
      ) : undefined;
    return (
      <>
        {insularCallout}
        {this.maybeRenderLocalGraph()}
        <StyledTabs>
          {instanceDetails && instanceDetails.description && (
            <Tab id="description" title="Description" panel={this.renderDescription()} />
          )}
          {this.shouldRenderStats() && <Tab id="stats" title="Details" panel={this.renderVersionAndCounts()} />}
          {federationRestrictions && Object.keys(federationRestrictions).length > 0 && (
            <Tab
              id="federationRestrictions"
              title="Federation"
              panel={<FederationTab restrictions={federationRestrictions} />}
            />
          )}
          <Tab id="neighbors" title="Neighbors" panel={this.renderNeighbors()} />
          <Tab id="peers" title="Known peers" panel={this.renderPeers()} />
        </StyledTabs>
        <StyledLinkToFdNetwork>
          <AnchorButton
            href={`https://fedidb.org/network/instance?domain=${this.props.instanceName}`}
            minimal
            rightIcon={IconNames.SHARE}
            target="_blank"
            text="See more statistics at fedidb.org"
          />
        </StyledLinkToFdNetwork>
      </>
    );
  };

  private maybeRenderLocalGraph = () => {
    const { localGraph } = this.state;
    const hasLocalGraph = !!localGraph && localGraph.nodes.length > 0 && localGraph.edges.length > 0;
    if (!hasLocalGraph || !localGraph) {
      return;
    }
    return (
      <StyledGraphContainer aria-hidden>
        <Cytoscape
          elements={localGraph}
          currentNodeId={this.props.instanceName}
          navigateToInstancePath={this.props.navigateToInstance}
          showEdges
        />
        <Divider />
      </StyledGraphContainer>
    );
  };

  private shouldRenderStats = () => {
    const details = this.props.instanceDetails;
    return details && (details.version || details.userCount || details.statusCount || details.domainCount);
  };

  private renderDescription = () => {
    const { instanceDetails } = this.props;
    if (!instanceDetails) {
      return;
    }
    const { description } = instanceDetails;
    if (!description) {
      return;
    }
    return <p className={Classes.RUNNING_TEXT} dangerouslySetInnerHTML={{ __html: sanitize(description) }} />;
  };

  private renderVersionAndCounts = () => {
    if (!this.props.instanceDetails) {
      throw new Error("Did not receive instance details as expected!");
    }
    const {
      version,
      userCount,
      statusCount,
      domainCount,
      lastUpdated,
      insularity,
      type,
      statusesPerDay,
      statusesPerUserPerDay,
    } = this.props.instanceDetails;
    return (
      <StyledHTMLTable small striped>
        <tbody>
          <tr>
            <td>Version</td>
            <td>{<Code>{version}</Code> || "Unknown"}</td>
          </tr>
          <tr>
            <td>Instance type</td>
            <td>{(type && <InstanceType type={type} colorAfterName />) || "Unknown"}</td>
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
              Insularity
              {"  "}
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
            <td>
              Statuses / day
              {"  "}
              <Tooltip
                content={
                  <span>
                    The average number of statuses written each day on this instance,
                    <br />
                    over the last month.
                  </span>
                }
                position={Position.TOP}
                className={Classes.DARK}
              >
                <Icon icon={IconNames.HELP} iconSize={Icon.SIZE_STANDARD} />
              </Tooltip>
            </td>
            <td>{(statusesPerDay && numeral.default(statusesPerDay).format("0.0")) || "Unknown"}</td>
          </tr>
          <tr>
            <td>
              Statuses / person / day
              {"  "}
              <Tooltip
                content={
                  <span>
                    The average number of statuses written per person each day,
                    <br />
                    over the last month.
                  </span>
                }
                position={Position.TOP}
                className={Classes.DARK}
              >
                <Icon icon={IconNames.HELP} iconSize={Icon.SIZE_STANDARD} />
              </Tooltip>
            </td>
            <td>{(statusesPerUserPerDay && numeral.default(statusesPerUserPerDay).format("0.000")) || "Unknown"}</td>
          </tr>
          <tr>
            <td>Known peers</td>
            <td>{(domainCount && numeral.default(domainCount).format("0,0")) || "Unknown"}</td>
          </tr>
          <tr>
            <td>Last updated</td>
            <td>{moment(`${lastUpdated}Z`).fromNow() || "Unknown"}</td>
          </tr>
        </tbody>
      </StyledHTMLTable>
    );
  };

  private renderNeighbors = () => {
    if (!this.state.neighbors) {
      return;
    }
    const neighborRows = orderBy(this.state.neighbors, ["weight"], ["desc"]).map(
      (neighborDetails: any, idx: number) => (
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
      )
    );
    return (
      <div>
        <NeighborsCallout icon={IconNames.INFO_SIGN} title="Warning">
          <p>
            Instances that {this.props.instanceName} has blocked may appear on this list and vice versa. This can happen
            if users attempt to mention someone on an instance that has blocked them.
          </p>
        </NeighborsCallout>
        <p className={Classes.TEXT_MUTED}>
          The mention ratio is how often people on the two instances mention each other per status. A mention ratio of 1
          would mean that every single status on {this.props.instanceName} contained a mention of someone on the other
          instance, and vice versa.
        </p>
        <StyledHTMLTable small striped interactive={false}>
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
    const { instanceDetails } = this.props;
    if (!instanceDetails) {
      return;
    }
    const { peers } = instanceDetails;
    if (!peers || peers.length === 0) {
      return;
    }
    const peerRows = peers.map((instance: Peer) => (
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
        <StyledHTMLTable small striped interactive={false} className="fediverse-sidebar-table">
          <tbody>{peerRows}</tbody>
        </StyledHTMLTable>
      </div>
    );
  };

  private renderLoadingState = () => <NonIdealState icon={<Spinner />} />;

  private renderPersonalInstanceErrorState = () => (
    <NonIdealState
      icon={IconNames.BLOCKED_PERSON}
      title="No data"
      description="This instance has fewer than 10 users. It was not crawled in order to protect their privacy, but if it's your instance you can opt in."
      action={
        <Link to="/admin" className={Classes.BUTTON} role="button">
          Opt in
        </Link>
      }
    />
  );

  private renderMissingDataState = () => (
    <>
      <NonIdealState
        icon={IconNames.ERROR}
        title="No data"
        description="This instance could not be crawled. Either it was down or it's an instance type we don't support yet."
      />
      <span className="sidebar-hidden-instance-status" style={{ display: "none" }}>
        {this.props.instanceDetails && this.props.instanceDetails.status}
      </span>
    </>
  );

  private renderRobotsTxtState = () => (
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

  private openInstanceLink = () => {
    window.open(`https://${this.props.instanceName}`, "_blank");
  };
}

const mapStateToProps = (state: AppState) => {
  const match = domainMatchSelector(state);
  return {
    graph: state.data.graphResponse && state.data.graphResponse.graph,
    instanceDetails: state.currentInstance.currentInstanceDetails,
    instanceLoadError: state.currentInstance.error,
    instanceName: match && match.params.domain,
    isLoadingInstanceDetails: state.currentInstance.isLoadingInstanceDetails,
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateToInstance: (domain: string) => dispatch(push(`/instance/${domain}`)),
  navigateToRoot: () => dispatch(push("/")),
});
const InstanceScreen = connect(mapStateToProps, mapDispatchToProps)(InstanceScreenImpl);
export default InstanceScreen;
