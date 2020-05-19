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
      <Navbar fixedToTop>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>fediverse.space</Navbar.Heading>
          <Navbar.Divider />
          <NavLink
            to="/"
            className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.GLOBE_NETWORK}`}
            activeClassName={Classes.INTENT_PRIMARY}
            isActive={graphIsActive as any}
          >
            Home
          </NavLink>
          <NavLink
            to="/instances"
            className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.TH}`}
            activeClassName={Classes.INTENT_PRIMARY}
          >
            Instances
          </NavLink>
          <NavLink
            to="/about"
            className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.INFO_SIGN}`}
            activeClassName={Classes.INTENT_PRIMARY}
            exact
          >
            About
          </NavLink>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <NavLink
            to="/admin"
            className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.COG}`}
            activeClassName={Classes.INTENT_PRIMARY}
          >
            Administration
          </NavLink>
        </Navbar.Group>
      </Navbar>
    );
  }
}

export default Nav;
