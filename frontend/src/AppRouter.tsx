import React from "react";

import { Classes } from "@blueprintjs/core";

import { ConnectedRouter } from "connected-react-router";
import { Route, Switch } from "react-router-dom";
import { Nav } from "./components/organisms";
import {
  AboutScreen,
  AdminScreen,
  GraphScreen,
  LoginScreen,
  TableScreen,
  VerifyLoginScreen,
} from "./components/screens";
import { history } from "./index";

const AppRouter: React.FC = () => (
  <ConnectedRouter history={history}>
    <div className={`${Classes.DARK} App`}>
      <Nav />
      <main role="main">
        <Switch>
          <Route path="/instances" exact>
            <TableScreen />
          </Route>
          <Route path="/about" exact>
            <AboutScreen />
          </Route>
          <Route path="/admin/login" exact>
            <LoginScreen />
          </Route>
          <Route path="/admin/verify" exact>
            <VerifyLoginScreen />
          </Route>
          <Route path="/admin" exact>
            <AdminScreen />
          </Route>
        </Switch>
        {/* We always want the GraphScreen to be rendered (since un- and re-mounting it is expensive */}
        <GraphScreen />
      </main>
    </div>
  </ConnectedRouter>
);
export default AppRouter;
