import { Button } from "@blueprintjs/core";
import * as React from "react";
import { FloatingCard } from "../atoms/";

interface IFloatingResetButtonProps {
  onClick?: () => any;
}
const FloatingResetButton: React.FC<IFloatingResetButtonProps> = ({ onClick }) => (
  <FloatingCard>
    <Button icon="compass" onClick={onClick} />
  </FloatingCard>
);
export default FloatingResetButton;