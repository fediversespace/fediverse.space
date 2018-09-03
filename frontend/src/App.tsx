import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { NonIdealState, Spinner } from '@blueprintjs/core';

import { Graph } from './components/Graph';
import { Nav } from './components/Nav';
import { Sidebar } from './components/Sidebar';
import { fetchGraph, fetchInstances } from './redux/actions';
import { IAppState, IGraph, IInstance } from './redux/types';

interface IAppProps {
  graph?: IGraph;
  instances?: IInstance[],
  isLoadingGraph: boolean;
  isLoadingInstances: boolean,
  fetchInstances: () => void;
  fetchGraph: () => void;
}
class AppImpl extends React.Component<IAppProps> {
  public render() {
    let body = <div />;
    if (this.props.isLoadingInstances || this.props.isLoadingGraph) {
      body = this.loadingState("Loading...");
    } else if (!!this.props.graph) {
      body = this.graphState();
    }
    return (
      <div className="App bp3-dark">
        <Nav />
        {body}
      </div>
    );
  }

  public componentDidMount() {
    this.load();
  }

  public componentDidUpdate() {
    this.load();
  }

  private load = () => {
    if (!this.props.instances && !this.props.isLoadingInstances) {
      this.props.fetchInstances();
    }
    if (!this.props.graph && !this.props.isLoadingGraph) {
      this.props.fetchGraph();
    }
  }

  private graphState = () => {
    return (
      <div>
        <Sidebar />
        <Graph />
      </div>
    )
  }

  private loadingState = (title?: string) => {
    return (
        <NonIdealState
          icon={<Spinner />}
          title={title || "Loading..."}
        />
    )
  }
}

const mapStateToProps = (state: IAppState) => ({
  graph: state.data.graph,
  instances: state.data.instances,
  isLoadingGraph: state.data.isLoadingGraph,
  isLoadingInstances: state.data.isLoadingInstances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchGraph: () => dispatch(fetchGraph() as any),
  fetchInstances: () => dispatch(fetchInstances() as any),
})
export const App = connect(mapStateToProps, mapDispatchToProps)(AppImpl)
