import { Button, Classes, H5, MenuItem } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { ItemRenderer, Select } from "@blueprintjs/select";
import * as numeral from "numeral";
import React from "react";
import styled from "styled-components";
import { FloatingCard, InstanceType } from ".";
import { QUANTITATIVE_COLOR_SCHEME } from "../../constants";
import { ColorScheme } from "../../types";

const ColorSchemeSelect = Select.ofType<ColorScheme>();

const StyledLi = styled.li`
  margin-top: 2px;
`;
const StyledKeyContainer = styled.div`
  margin-top: 10px;
`;
const ColorKeyContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 100px;
`;
const ColorBarContainer = styled.div`
  width: 10px;
  display: flex;
  flex-direction: column;
  margin-right: 10px;
`;
interface ColorBarProps {
  color: string;
}
const ColorBar = styled.div<ColorBarProps>`
  width: 10px;
  background-color: ${(props) => props.color};
  flex: 1;
`;
const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const renderItem: ItemRenderer<ColorScheme> = (colorScheme, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return <MenuItem active={modifiers.active} key={colorScheme.name} onClick={handleClick} text={colorScheme.name} />;
};

const renderQualitativeKey = (values: string[]) => (
  <ul className={Classes.LIST_UNSTYLED}>
    {values.map((v) => (
      <StyledLi key={v}>
        <InstanceType type={v} />
      </StyledLi>
    ))}
  </ul>
);

const renderQuantitativeKey = (range: number[]) => {
  const [min, max] = range;
  return (
    <ColorKeyContainer>
      <ColorBarContainer>
        {QUANTITATIVE_COLOR_SCHEME.map((color) => (
          <ColorBar color={color} key={color} />
        ))}
      </ColorBarContainer>
      <TextContainer>
        <span className={Classes.TEXT_SMALL}>{numeral.default(min).format("0")}</span>
        <span className={Classes.TEXT_SMALL}>{numeral.default(max).format("0")}</span>
      </TextContainer>
    </ColorKeyContainer>
  );
};
interface GraphKeyProps {
  current?: ColorScheme;
  colorSchemes: ColorScheme[];
  ranges?: { [key: string]: [number, number] };
  onItemSelect: (colorScheme?: ColorScheme) => void;
}
const GraphKey: React.FC<GraphKeyProps> = ({ current, colorSchemes, ranges, onItemSelect }) => {
  const unsetColorScheme = () => {
    onItemSelect(undefined);
  };
  let key;
  if (current) {
    if (current.type === "qualitative") {
      key = renderQualitativeKey(current.values);
    } else if (current.type === "quantitative") {
      key = renderQuantitativeKey(ranges![current.cytoscapeDataKey]);
    }
  }
  return (
    <FloatingCard>
      <H5>Color coding</H5>
      <ColorSchemeSelect
        activeItem={current}
        filterable={false}
        items={colorSchemes}
        itemRenderer={renderItem}
        onItemSelect={onItemSelect}
        popoverProps={{ minimal: true }}
      >
        <Button
          text={(current && current.name) || "Select..."}
          icon={IconNames.TINT}
          rightIcon={IconNames.CARET_DOWN}
          tabIndex={-1}
        />
        <Button icon={IconNames.SMALL_CROSS} minimal onClick={unsetColorScheme} disabled={!current} tabIndex={-1} />
      </ColorSchemeSelect>
      <br />
      {!!current && !!key && (
        <>
          {current.description && <span className={Classes.TEXT_MUTED}>{current.description}</span>}
          <StyledKeyContainer>{key}</StyledKeyContainer>
        </>
      )}
    </FloatingCard>
  );
};

export default GraphKey;
