import "../node_modules/@blueprintjs/core/lib/css/blueprint.css";
import "../node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css";
import "../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import "../node_modules/normalize.css/normalize.css";
import "./index.css";

import cytoscape from "cytoscape";
import popper from "cytoscape-popper";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, compose, createStore } from "redux";
import thunk from "redux-thunk";

import { FocusStyleManager } from "@blueprintjs/core";

import { routerMiddleware } from "connected-react-router";
import { createBrowserHistory } from "history";
import AppRouter from "./AppRouter";
import createRootReducer from "./redux/reducers";

// https://blueprintjs.com/docs/#core/accessibility.focus-management
FocusStyleManager.onlyShowFocusOnTabs();

export const history = createBrowserHistory();

// Initialize redux
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  createRootReducer(history),
  composeEnhancers(applyMiddleware(routerMiddleware(history), thunk))
);

// Initialize cytoscape plugins
cytoscape.use(popper as any);

ReactDOM.render(
  <Provider store={store}>
    <AppRouter />
  </Provider>,
  document.getElementById("root") as HTMLElement
);

// if (process.env.NODE_ENV !== "production") {
//   // tslint:disable-next-line:no-var-requires
//   const axe = require("react-axe");
//   axe(React, ReactDOM, 5000);
// }
