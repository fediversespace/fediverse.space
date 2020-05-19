import { NonIdealState } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import * as React from "react";

interface ErrorStateProps {
  description?: string;
}
const ErrorState: React.FC<ErrorStateProps> = ({ description }) => (
  <NonIdealState icon={IconNames.ERROR} title="Something went wrong." description={description} />
);

export default ErrorState;
