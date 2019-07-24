import React from "react";
import styled from "styled-components";
import { IColorSchemeType } from "../../types";
import { GraphKey, GraphResetButton } from "../atoms";

const GraphToolsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

interface IGraphToolsProps {
  currentColorScheme?: IColorSchemeType;
  colorSchemes: IColorSchemeType[];
  onColorSchemeSelect: (colorScheme?: IColorSchemeType) => void;
  onResetButtonClick: () => void;
}
const GraphTools: React.FC<IGraphToolsProps> = ({
  currentColorScheme,
  colorSchemes,
  onColorSchemeSelect,
  onResetButtonClick
}) => {
  return (
    <GraphToolsContainer>
      <GraphResetButton onClick={onResetButtonClick} />
      <GraphKey current={currentColorScheme} colorSchemes={colorSchemes} onItemSelect={onColorSchemeSelect} />
    </GraphToolsContainer>
  );
};
export default GraphTools;
