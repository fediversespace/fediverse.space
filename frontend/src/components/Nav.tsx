import * as React from "react";

import { Alignment, Button, Navbar } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import { Link } from "react-router-dom";
import styled from "styled-components";
import { InstanceSearch } from "./InstanceSearch";

interface INavState {
  aboutIsOpen: boolean;
}
export class Nav extends React.Component<{}, INavState> {
  constructor(props: any) {
    super(props);
    this.state = { aboutIsOpen: false };
  }

  public render() {
    const StyledLink = styled(Link)`
      color: white !important;
    `;
    return (
      <Navbar fixedToTop={true}>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>fediverse.space</Navbar.Heading>
          <Navbar.Divider />
          <StyledLink to="/">
            <Button icon={IconNames.GLOBE_NETWORK} text="Home" minimal={true} />
          </StyledLink>
          <StyledLink to="/about">
            <Button icon={IconNames.INFO_SIGN} text="About" minimal={true} />
          </StyledLink>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <InstanceSearch />
        </Navbar.Group>
      </Navbar>
    );
  }
}
