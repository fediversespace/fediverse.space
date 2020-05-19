import { Button } from "@blueprintjs/core";
import * as React from "react";
import FloatingCard from "./FloatingCard";

interface GraphResetButtonProps {
  onClick: () => void;
}
const GraphResetButton: React.FC<GraphResetButtonProps> = ({ onClick }) => (
  <FloatingCard>
    <Button icon="compass" title="Reset graph view" onClick={onClick} tabIndex={-1} />
  </FloatingCard>
);
export default GraphResetButton;
