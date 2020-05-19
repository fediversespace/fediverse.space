import { Switch } from "@blueprintjs/core";
import * as React from "react";
import styled from "styled-components";
import FloatingCard from "./FloatingCard";

const StyledSwitch = styled(Switch)`
  margin: 0;
`;

interface GraphHideEdgesButtonProps {
  isShowingEdges: boolean;
  toggleEdges: () => void;
}
const GraphHideEdgesButton: React.FC<GraphHideEdgesButtonProps> = ({ isShowingEdges, toggleEdges }) => (
  <FloatingCard>
    <StyledSwitch checked={isShowingEdges} label="Show connections" onChange={toggleEdges} tabIndex={-1} />
  </FloatingCard>
);
export default GraphHideEdgesButton;
