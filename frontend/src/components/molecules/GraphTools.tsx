import React from "react";
import styled from "styled-components";
import { IColorScheme } from "../../types";
import { GraphKey, GraphResetButton } from "../atoms";

const GraphToolsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

interface IGraphToolsProps {
  currentColorScheme?: IColorScheme;
  colorSchemes: IColorScheme[];
  ranges?: { [key: string]: [number, number] };
  onColorSchemeSelect: (colorScheme?: IColorScheme) => void;
  onResetButtonClick: () => void;
}
const GraphTools: React.FC<IGraphToolsProps> = ({
  currentColorScheme,
  colorSchemes,
  ranges,
  onColorSchemeSelect,
  onResetButtonClick
}) => {
  return (
    <GraphToolsContainer>
      <GraphResetButton onClick={onResetButtonClick} />
      <GraphKey
        current={currentColorScheme}
        colorSchemes={colorSchemes}
        onItemSelect={onColorSchemeSelect}
        ranges={ranges}
      />
    </GraphToolsContainer>
  );
};
export default GraphTools;
