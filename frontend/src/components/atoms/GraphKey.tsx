import { Button, Classes, H5, H6, MenuItem } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { ItemRenderer, Select } from "@blueprintjs/select";
import React from "react";
import styled from "styled-components";
import { FloatingCard, InstanceType } from ".";
import { IColorSchemeType } from "../../types";

const ColorSchemeSelect = Select.ofType<IColorSchemeType>();

const StyledLi = styled.li`
  margin-top: 2px;
`;
const StyledKeyContainer = styled.div`
  margin-top: 10px;
`;

interface IGraphKeyProps {
  current?: IColorSchemeType;
  colorSchemes: IColorSchemeType[];
  onItemSelect: (colorScheme?: IColorSchemeType) => void;
}
const GraphKey: React.FC<IGraphKeyProps> = ({ current, colorSchemes, onItemSelect }) => {
  const unsetColorScheme = () => {
    onItemSelect(undefined);
  };
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
        />
        <Button icon={IconNames.SMALL_CROSS} minimal={true} onClick={unsetColorScheme} disabled={!current} />
      </ColorSchemeSelect>
      {current && (
        <StyledKeyContainer>
          <H6>Key</H6>
          <ul className={Classes.LIST_UNSTYLED}>
            {current.values.map(v => (
              <StyledLi>
                <InstanceType type={v} />
              </StyledLi>
            ))}
          </ul>
        </StyledKeyContainer>
      )}
    </FloatingCard>
  );
};

const renderItem: ItemRenderer<IColorSchemeType> = (colorScheme, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return <MenuItem active={modifiers.active} key={colorScheme.name} onClick={handleClick} text={colorScheme.name} />;
};

export default GraphKey;
