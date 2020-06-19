import * as React from "react";

import { Alignment, Navbar, Classes } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { match, NavLink } from "react-router-dom";
import { InstanceDomainPath } from "../../constants";

interface NavState {
  aboutIsOpen: boolean;
}

const graphIsActive = (currMatch: match<InstanceDomainPath>, location: Location) =>
  location.pathname === "/" || location.pathname.startsWith("/instance/");

class Nav extends React.Component<{}, NavState> {
  constructor(props: any) {
    super(props);
    this.state = { aboutIsOpen: false };
  }

  public render() {
    return (
      <nav role="navigation">
        <Navbar fixedToTop={true}>
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>fediverse.space</Navbar.Heading>
            <Navbar.Divider />
            <NavLink
              to="/"
              className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.GLOBE_NETWORK}`}
              isActive={graphIsActive as any}
              activeClassName="current-navbar-item"
            >
              Home
            </NavLink>
            <NavLink
              to="/instances"
              className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.TH}`}
              activeClassName="current-navbar-item"
            >
              Instances
            </NavLink>
            <NavLink
              to="/about"
              className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.INFO_SIGN}`}
              activeClassName="current-navbar-item"
              exact={true}
            >
              About
            </NavLink>
          </Navbar.Group>
          <Navbar.Group align={Alignment.RIGHT}>
            <NavLink
              to="/admin"
              className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.COG}`}
              activeClassName="current-navbar-item"
            >
              Administration
            </NavLink>
          </Navbar.Group>
        </Navbar>
      </nav>
    );
  }
}

export default Nav;
