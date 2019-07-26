import React from "react";

import { Classes } from "@blueprintjs/core";

import { ConnectedRouter } from "connected-react-router";
import { Route } from "react-router-dom";
import { Nav } from "./components/organisms/";
import { AboutScreen, AdminScreen, GraphScreen, LoginScreen, VerifyLoginScreen } from "./components/screens/";
import { history } from "./index";

const AppRouter: React.FC = () => (
  <ConnectedRouter history={history}>
    <div className={`${Classes.DARK} App`}>
      <Nav />
      <Route path="/about" exact={true} component={AboutScreen} />
      <Route path="/admin/login" exact={true} component={LoginScreen} />
      <Route path="/admin/verify" exact={true} component={VerifyLoginScreen} />
      <Route path="/admin" exact={true} component={AdminScreen} />
      {/* We always want the GraphScreen to be rendered (since un- and re-mounting it is expensive */}
      <GraphScreen />
    </div>
  </ConnectedRouter>
);
export default AppRouter;
