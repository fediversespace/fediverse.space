import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Button, Classes, Dialog, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import ErrorState from './components/ErrorState';
import { Graph } from './components/Graph';
import { Nav } from './components/Nav';
import { Sidebar } from './components/Sidebar';
import { DESKTOP_WIDTH_THRESHOLD } from './constants';
import { fetchGraph, fetchInstances } from './redux/actions';
import { IAppState, IGraph, IInstance } from './redux/types';

interface IAppProps {
  graph?: IGraph;
  instances?: IInstance[],
  isLoadingGraph: boolean;
  isLoadingInstances: boolean,
  graphLoadError: boolean,
  fetchInstances: () => void;
  fetchGraph: () => void;
}
interface IAppLocalState {
  mobileDialogOpen: boolean;
}
class AppImpl extends React.Component<IAppProps, IAppLocalState> {

  constructor(props: IAppProps) {
    super(props);
    this.state = { mobileDialogOpen: false };
  }

  public render() {
    let body = <div />;
    if (this.props.isLoadingInstances || this.props.isLoadingGraph) {
      body = this.loadingState("Loading...");
    } else {
      body = this.graphState();
    }
    return (
      <div className="App bp3-dark">
        <Nav />
        {body}
        {this.renderMobileDialog()}
      </div>
    );
  }

  public componentDidMount() {
    if (window.innerWidth < DESKTOP_WIDTH_THRESHOLD) {
      this.handleMobileDialogOpen();
    }
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
  }

  private graphState = () => {
    const content = this.props.graphLoadError ? <ErrorState /> : <Graph />
    return (
      <div>
        <Sidebar />
        {content}
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

  private renderMobileDialog = () => {
    return (
      <Dialog
          icon={IconNames.DESKTOP}
          title="Desktop-optimized site"
          onClose={this.handleMobileDialogClose}
          isOpen={this.state.mobileDialogOpen}
          className={Classes.DARK + ' fediverse-about-dialog'}
      >
          <div className={Classes.DIALOG_BODY}>
              <p className={Classes.RUNNING_TEXT}>
                fediverse.space is optimized for desktop computers. Feel free to check it out on your phone
                (ideally in landscape mode) but for best results, open it on a computer.
              </p>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                  <Button
                      icon={IconNames.THUMBS_UP}
                      text="OK!"
                      onClick={this.handleMobileDialogClose}
                  />
              </div>
          </div>
      </Dialog>
    );
  }

  private handleMobileDialogOpen = () => {
    this.setState({ mobileDialogOpen: true });
  }

  private handleMobileDialogClose = () => {
    this.setState({ mobileDialogOpen: false });
  }
}

const mapStateToProps = (state: IAppState) => ({
  graph: state.data.graph,
  graphLoadError: state.data.error,
  instances: state.data.instances,
  isLoadingGraph: state.data.isLoadingGraph,
  isLoadingInstances: state.data.isLoadingInstances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchGraph: () => dispatch(fetchGraph() as any),
  fetchInstances: () => dispatch(fetchInstances() as any),
})
export const App = connect(mapStateToProps, mapDispatchToProps)(AppImpl)
