import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Button, Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

import { Nav } from './components/Nav';
import { fetchInstances } from './redux/actions';
import { IAppState, IInstance } from './redux/types';

interface IAppProps {
  currentInstanceName?: string | null;
  instances?: IInstance[],
  isLoadingInstances: boolean,
  fetchInstances: () => void;
}
class AppImpl extends React.Component<IAppProps> {
  public render() {
    let body = this.welcomeState();
    if (this.props.isLoadingInstances) {
      body = this.loadingState();
    } else if (!!this.props.instances) {
      body = this.renderGraph()
    }
    // TODO: show the number of instances up front
    return (
      <div className="App bp3-dark">
        <Nav />
        {body}
      </div>
    );
  }

  private welcomeState = () => {
    return (
        <NonIdealState
          className="fediverse-welcome"
          icon={IconNames.GLOBE_NETWORK}
          title="Welcome to fediverse.space!"
          description="There are currently $MANY known instances, so loading them might take a little while. Ready?"
          action={<Button intent={Intent.PRIMARY} text={"Let's go"} onClick={this.props.fetchInstances} />}
        />
    )
  }

  private loadingState = () => {
    return (
        <NonIdealState
          className="fediverse-welcome"
          icon={<Spinner />}
          title="Loading..."
        />
    )
  }

  private renderGraph = () => {
    return (
      <div>
        <NonIdealState
          className="fediverse-welcome"
          icon={IconNames.SEARCH_AROUND}
          title="Graph. TODO"
          description={"Selected " + (this.props.currentInstanceName || "nothing")}
        />
      </div>
    );
  }

}

const mapStateToProps = (state: IAppState) => ({
  currentInstanceName: state.currentInstanceName,
  instances: state.data.instances,
  isLoadingInstances: state.data.isLoadingInstances,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchInstances: () => dispatch(fetchInstances() as any)
})
export const App = connect(mapStateToProps, mapDispatchToProps)(AppImpl)
