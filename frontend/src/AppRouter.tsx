import * as React from "react";

import { Button, Classes, Dialog } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { ConnectedRouter } from "connected-react-router";
import { Route, RouteComponentProps } from "react-router-dom";
import { Nav } from "./components/organisms/";
import { AboutScreen, GraphScreen } from "./components/screens/";
import { DESKTOP_WIDTH_THRESHOLD, IInstanceDomainPath, INSTANCE_DOMAIN_PATH } from "./constants";
import { history } from "./index";

interface IAppLocalState {
  mobileDialogOpen: boolean;
}
export class AppRouter extends React.Component<{}, IAppLocalState> {
  constructor(props: {}) {
    super(props);
    this.state = { mobileDialogOpen: false };
  }

  public render() {
    return (
      <ConnectedRouter history={history}>
        <div className={`${Classes.DARK} App`}>
          <Nav />
          {/* We use `children={}` instead of `component={}` such that the graph is never unmounted */}
          <Route exact={true} path="/">
            <Route path={INSTANCE_DOMAIN_PATH}>
              {(routeProps: RouteComponentProps<IInstanceDomainPath>) => <GraphScreen {...routeProps} />}
            </Route>
          </Route>
          <Route path="/about" component={AboutScreen} />
          {this.renderMobileDialog()}
        </div>
      </ConnectedRouter>
    );
  }

  public componentDidMount() {
    if (window.innerWidth < DESKTOP_WIDTH_THRESHOLD) {
      this.handleMobileDialogOpen();
    }
  }

  private renderMobileDialog = () => {
    return (
      <Dialog
        icon={IconNames.DESKTOP}
        title="Desktop-optimized site"
        onClose={this.handleMobileDialogClose}
        isOpen={this.state.mobileDialogOpen}
        className={Classes.DARK + " fediverse-about-dialog"}
      >
        <div className={Classes.DIALOG_BODY}>
          <p className={Classes.RUNNING_TEXT}>
            fediverse.space is optimized for desktop computers. Feel free to check it out on your phone (ideally in
            landscape mode) but for best results, open it on a computer.
          </p>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button icon={IconNames.THUMBS_UP} text="OK!" onClick={this.handleMobileDialogClose} />
          </div>
        </div>
      </Dialog>
    );
  };

  private handleMobileDialogOpen = () => {
    this.setState({ mobileDialogOpen: true });
  };

  private handleMobileDialogClose = () => {
    this.setState({ mobileDialogOpen: false });
  };
}
