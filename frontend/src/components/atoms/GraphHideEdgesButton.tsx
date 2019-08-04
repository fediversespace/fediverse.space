import { Switch } from "@blueprintjs/core";
import * as React from "react";
import styled from "styled-components";
import FloatingCard from "./FloatingCard";

const StyledSwitch = styled(Switch)`
  margin: 0;
`;

interface IGraphHideEdgesButtonProps {
  isShowingEdges: boolean;
  toggleEdges: () => void;
}
const GraphHideEdgesButton: React.FC<IGraphHideEdgesButtonProps> = ({ isShowingEdges, toggleEdges }) => (
  <FloatingCard>
    <StyledSwitch checked={isShowingEdges} label="Show connections" onChange={toggleEdges} />
  </FloatingCard>
);
export default GraphHideEdgesButton;
