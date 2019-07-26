import { NonIdealState } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import * as React from "react";

interface IErrorStateProps {
  description?: string;
}
const ErrorState: React.FC<IErrorStateProps> = ({ description }) => (
  <NonIdealState icon={IconNames.ERROR} title={"Something went wrong."} description={description} />
);

export default ErrorState;
