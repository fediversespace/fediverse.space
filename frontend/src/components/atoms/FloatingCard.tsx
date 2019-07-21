import { Card, Elevation, ICardProps } from "@blueprintjs/core";
import * as React from "react";
import styled from "styled-components";

const FloatingCardElement = styled(Card)`
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 20;
`;

const FloatingCard: React.FC<ICardProps> = props => <FloatingCardElement elevation={Elevation.TWO} {...props} />;

export default FloatingCard;
