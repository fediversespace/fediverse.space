import { Button } from "@blueprintjs/core";
import * as React from "react";
import FloatingCard from "./FloatingCard";

interface IFloatingResetButtonProps {
  onClick?: () => any;
}
export const FloatingResetButton: React.FC<IFloatingResetButtonProps> = ({ onClick }) => (
  <FloatingCard>
    <Button icon="compass" onClick={onClick} />
  </FloatingCard>
);
