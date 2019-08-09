import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import React from "react";
import { QUALITATIVE_COLOR_SCHEME } from "../../constants";
import { typeColorScheme } from "../../types";
import { getTypeDisplayString } from "../../util";

interface IInstanceTypeProps {
  type: string;
  colorAfterName?: boolean;
}
/**
 * By default, renders the color followed by the name of the instance type.
 * You can change this by passing `colorAfterName={true}`.
 */
const InstanceType: React.FC<IInstanceTypeProps> = ({ type, colorAfterName }) => {
  const idx = typeColorScheme.values.indexOf(type);
  const name = " " + getTypeDisplayString(type);
  return (
    <>
      {!!colorAfterName && name}
      <Icon icon={IconNames.SYMBOL_CIRCLE} color={QUALITATIVE_COLOR_SCHEME[idx]} />
      {!colorAfterName && name}
    </>
  );
};
export default InstanceType;
