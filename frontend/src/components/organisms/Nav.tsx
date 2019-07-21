import * as React from "react";

import { Alignment, Navbar } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { Classes } from "@blueprintjs/core";
import { match, NavLink } from "react-router-dom";
import { InstanceSearch } from ".";
import { IInstanceDomainPath } from "../../constants";

interface INavState {
  aboutIsOpen: boolean;
}

const linkIsActive = (currMatch: match<IInstanceDomainPath>, location: Location) => {
  return location.pathname === "/" || location.pathname.startsWith("/instance/");
};

class Nav extends React.Component<{}, INavState> {
  constructor(props: any) {
    super(props);
    this.state = { aboutIsOpen: false };
  }

  public render() {
    return (
      <Navbar fixedToTop={true}>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>fediverse.space</Navbar.Heading>
          <Navbar.Divider />
          <NavLink
            to="/"
            className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.GLOBE_NETWORK}`}
            activeClassName={Classes.INTENT_PRIMARY}
            isActive={linkIsActive as any}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={`${Classes.BUTTON} ${Classes.MINIMAL} bp3-icon-${IconNames.INFO_SIGN}`}
            activeClassName={Classes.INTENT_PRIMARY}
            exact={true}
          >
            About
          </NavLink>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <InstanceSearch />
        </Navbar.Group>
      </Navbar>
    );
  }
}

export default Nav;
