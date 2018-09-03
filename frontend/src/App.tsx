import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Button, Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

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
    let body = this.welcomeState();
    if (this.props.isLoadingInstances) {
      body = this.loadingState("Loading instances...");
    } else if (this.props.isLoadingGraph) {
      body = this.loadingState("Loading graph...");
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
    this.props.fetchInstances();
  }

  private graphState = () => {
    return (
      <div>
        <Sidebar />
        <Graph />
      </div>
    )
  }

  private welcomeState = () => {
    const numInstances = this.props.instances ? this.props.instances.length : "lots of";
    const description = `There are ${numInstances} known instances, so loading the graph might take a little while. Ready?`
    return (
        <NonIdealState
          icon={IconNames.GLOBE_NETWORK}
          title="Welcome to fediverse.space!"
          description={description}
          action={<Button intent={Intent.PRIMARY} text={"Let's go"} onClick={this.props.fetchGraph} />}
        />
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
