import { NonIdealState } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import * as React from "react";

export const ErrorState: React.SFC = () => <NonIdealState icon={IconNames.ERROR} title={"Something went wrong."} />;
