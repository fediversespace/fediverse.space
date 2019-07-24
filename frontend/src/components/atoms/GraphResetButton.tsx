import { Button } from "@blueprintjs/core";
import * as React from "react";
import FloatingCard from "./FloatingCard";

interface IGraphResetButtonProps {
  onClick: () => void;
}
const GraphResetButton: React.FC<IGraphResetButtonProps> = ({ onClick }) => (
  <FloatingCard>
    <Button icon="compass" title="Reset graph view" onClick={onClick} />
  </FloatingCard>
);
export default GraphResetButton;
