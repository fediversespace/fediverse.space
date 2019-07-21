import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import styled from "styled-components";

import { NonIdealState, Spinner } from "@blueprintjs/core";

import { fetchGraph, fetchInstances, loadInstance } from "../../redux/actions";
import { IAppState } from "../../redux/types";
import { domainMatchSelector } from "../../util";
import { ErrorState } from "../molecules/";
import { Graph, Sidebar } from "../organisms/";

const GraphContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;
const FullDiv = styled.div`
  position: absolute;
  top: 50px;
  bottom: 0;
  left: 0;
  right: 0;
`;

interface IGraphScreenProps {
  currentInstanceName: string | null;
  pathname: string;
  isLoadingGraph: boolean;
  isLoadingInstances: boolean;
  graphLoadError: boolean;
  loadInstance: (domain: string | null) => void;
  fetchInstances: () => void;
  fetchGraph: () => void;
}
/**
 * This component takes care of loading or deselecting the current instance when the URL path changes.
 */
class GraphScreenImpl extends React.Component<IGraphScreenProps> {
  public render() {
    let content;
    if (this.props.isLoadingInstances || this.props.isLoadingGraph) {
      content = this.loadingState("Loading...");
    } else if (!!this.props.graphLoadError) {
      content = <ErrorState />;
    } else {
      content = (
        <GraphContainer>
          <Graph />
          <Sidebar />
        </GraphContainer>
      );
    }
    return <FullDiv>{content}</FullDiv>;
  }

  public componentDidMount() {
    this.loadInstancesAndGraph();
    this.loadCurrentInstance();
  }

  public componentDidUpdate(prevProps: IGraphScreenProps) {
    this.loadCurrentInstance(prevProps.currentInstanceName);
  }

  private loadInstancesAndGraph = () => {
    if (!this.props.isLoadingGraph && !this.props.graphLoadError) {
      this.props.fetchGraph();
    }
    if (!this.props.isLoadingInstances && !this.props.graphLoadError) {
      this.props.fetchInstances();
    }
  };

  private loadCurrentInstance = (prevInstanceName?: string | null) => {
    if (prevInstanceName !== this.props.currentInstanceName) {
      this.props.loadInstance(this.props.currentInstanceName);
    }
  };

  private loadingState = (title?: string) => {
    return <NonIdealState icon={<Spinner />} title={title || "Loading..."} />;
  };
}

const mapStateToProps = (state: IAppState) => {
  const match = domainMatchSelector(state);
  return {
    currentInstanceName: match && match.params.domain,
    graph: state.data.graph,
    graphLoadError: state.data.error,
    instances: state.data.instances,
    isLoadingGraph: state.data.isLoadingGraph,
    isLoadingInstances: state.data.isLoadingInstances,
    pathname: state.router.location.pathname
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchGraph: () => dispatch(fetchGraph() as any),
  fetchInstances: () => dispatch(fetchInstances() as any),
  loadInstance: (domain: string | null) => dispatch(loadInstance(domain) as any)
});
const GraphScreen = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphScreenImpl);
export default GraphScreen;
