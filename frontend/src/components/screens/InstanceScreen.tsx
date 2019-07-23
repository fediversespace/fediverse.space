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
  Tooltip
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { push } from "connected-react-router";
import { Link } from "react-router-dom";
import { Dispatch } from "redux";
import styled from "styled-components";
import { IAppState, IGraph, IInstanceDetails } from "../../redux/types";
import { domainMatchSelector } from "../../util";
import { ErrorState } from "../molecules/";

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
const StyledTabs = styled(Tabs)`
  width: 100%;
`;
interface IInstanceScreenProps {
  graph?: IGraph;
  instanceName: string | null;
  instanceLoadError: boolean;
  instanceDetails: IInstanceDetails | null;
  isLoadingInstanceDetails: boolean;
  navigateToRoot: () => void;
}

interface IInstanceScreenState {
  neighbors?: string[];
  isProcessingNeighbors: boolean;
}
class InstanceScreenImpl extends React.PureComponent<IInstanceScreenProps, IInstanceScreenState> {
  public constructor(props: IInstanceScreenProps) {
    super(props);
    this.state = { isProcessingNeighbors: false };
  }

  public render() {
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
      <InstanceScreenContainer>
        <HeadingContainer>
          <StyledHeadingH2>{this.props.instanceName}</StyledHeadingH2>
          <StyledHeadingTooltip content="Open link in new tab" position={Position.TOP} className={Classes.DARK}>
            <AnchorButton icon={IconNames.LINK} minimal={true} onClick={this.openInstanceLink} />
          </StyledHeadingTooltip>
          <StyledCloseButton icon={IconNames.CROSS} onClick={this.props.navigateToRoot} />
        </HeadingContainer>
        <Divider />
        {content}
      </InstanceScreenContainer>
    );
  }

  public componentDidMount() {
    this.processEdgesToFindNeighbors();
  }

  public componentDidUpdate(prevProps: IInstanceScreenProps, prevState: IInstanceScreenState) {
    if (prevProps.instanceName !== this.props.instanceName) {
      this.processEdgesToFindNeighbors();
    }
  }

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

  private renderTabs = () => {
    const hasNeighbors = this.state.neighbors && this.state.neighbors.length > 0;

    const insularCallout =
      this.props.graph && !this.state.isProcessingNeighbors && !hasNeighbors ? (
        <Callout icon={IconNames.INFO_SIGN} title="Insular instance">
          <p>This instance doesn't have any neighbors that we know of, so it's hidden from the graph.</p>
        </Callout>
      ) : (
        undefined
      );
    return (
      <>
        {insularCallout}
        <StyledTabs>
          {this.props.instanceDetails!.description && (
            <Tab id="description" title="Description" panel={this.renderDescription()} />
          )}
          {this.shouldRenderStats() && <Tab id="stats" title="Details" panel={this.renderVersionAndCounts()} />}
          <Tab id="neighbors" title="Neighbors" panel={this.renderNeighbors()} />
          <Tab id="peers" title="Known peers" panel={this.renderPeers()} />
        </StyledTabs>
        <StyledLinkToFdNetwork>
          <AnchorButton
            href={`https://fediverse.network/${this.props.instanceName}`}
            minimal={true}
            rightIcon={IconNames.SHARE}
            target="_blank"
            text="See more statistics at fediverse.network"
          />
        </StyledLinkToFdNetwork>
      </>
    );
  };

  private shouldRenderStats = () => {
    const details = this.props.instanceDetails;
    return details && (details.version || details.userCount || details.statusCount || details.domainCount);
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

  private renderLoadingState = () => <NonIdealState icon={<Spinner />} />;

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
const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateToRoot: () => dispatch(push("/"))
});
const InstanceScreen = connect(
  mapStateToProps,
  mapDispatchToProps
)(InstanceScreenImpl);
export default InstanceScreen;
