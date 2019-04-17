import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { NonIdealState, Spinner } from "@blueprintjs/core";

import { fetchGraph, fetchInstances } from "../../redux/actions";
import { IAppState, IGraph, IInstance } from "../../redux/types";
import { ErrorState } from "../ErrorState";
import { Graph } from "../Graph";
import { Sidebar } from "../Sidebar";

interface IGraphScreenProps {
  graph?: IGraph;
  instances?: IInstance[];
  isLoadingGraph: boolean;
  isLoadingInstances: boolean;
  graphLoadError: boolean;
  fetchInstances: () => void;
  fetchGraph: () => void;
}
class GraphScreenImpl extends React.Component<IGraphScreenProps> {
  public render() {
    let body = <div />;
    if (this.props.isLoadingInstances || this.props.isLoadingGraph) {
      body = this.loadingState("Loading...");
    } else {
      body = this.graphState();
    }
    return <div>{body}</div>;
  }

  public componentDidMount() {
    this.load();
  }

  public componentDidUpdate() {
    this.load();
  }

  private load = () => {
    if (!this.props.instances && !this.props.isLoadingInstances && !this.props.graphLoadError) {
      this.props.fetchInstances();
    }
    if (!this.props.graph && !this.props.isLoadingGraph && !this.props.graphLoadError) {
      this.props.fetchGraph();
    }
  };

  private graphState = () => {
    const content = this.props.graphLoadError ? <ErrorState /> : <Graph />;
    return (
      <div>
        <Sidebar />
        {content}
      </div>
    );
  };

  private loadingState = (title?: string) => {
    return <NonIdealState icon={<Spinner />} title={title || "Loading..."} />;
  };
}

const mapStateToProps = (state: IAppState) => ({
  graph: state.data.graph,
  graphLoadError: state.data.error,
  instances: state.data.instances,
  isLoadingGraph: state.data.isLoadingGraph,
  isLoadingInstances: state.data.isLoadingInstances
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchGraph: () => dispatch(fetchGraph() as any),
  fetchInstances: () => dispatch(fetchInstances() as any)
});
export const GraphScreen = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphScreenImpl);
