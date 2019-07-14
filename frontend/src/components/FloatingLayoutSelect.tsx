import { Button, H6, MenuItem } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { ItemRenderer, Select } from "@blueprintjs/select";
import * as React from "react";
import FloatingCard from "./FloatingCard";

interface ILayoutToDisplayName {
  [key: string]: string;
}
const layouts: ILayoutToDisplayName = {
  cola: "COLA",
  cose: "CoSE"
};
const LayoutSelect = Select.ofType<string>();

const LayoutItemRenderer: ItemRenderer<string> = (layout, { handleClick, modifiers }) => (
  <MenuItem active={modifiers.active} key={layout} onClick={handleClick} text={layout} />
);

interface IFloatingLayoutSelectProps {
  currentLayoutKey: string;
  onItemSelect: (layout: string) => void;
  startLayout: () => void;
  stopLayout: () => void;
}
export const FloatingLayoutSelect: React.FC<IFloatingLayoutSelectProps> = ({
  currentLayoutKey,
  onItemSelect,
  startLayout,
  stopLayout
}) => {
  return (
    <FloatingCard>
      <H6>Layout</H6>
      <LayoutSelect
        items={Object.keys(layouts)}
        itemRenderer={LayoutItemRenderer}
        filterable={false}
        onItemSelect={onItemSelect}
        popoverProps={{ minimal: true }}
      >
        <Button
          icon="film"
          rightIcon="caret-down"
          text={currentLayoutKey ? layouts[currentLayoutKey] : "(No selection)"}
        />
      </LayoutSelect>
      <br />
      <Button icon={IconNames.PLAY} onClick={startLayout} />
      <Button icon={IconNames.STOP} onClick={stopLayout} />
    </FloatingCard>
  );
};
