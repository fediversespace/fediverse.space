import React from "react";
import styled from "styled-components";
import { ColorScheme } from "../../types";
import { GraphHideEdgesButton, GraphKey, GraphResetButton } from "../atoms";

const GraphToolsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

interface GraphToolsProps {
  currentColorScheme?: ColorScheme;
  colorSchemes: ColorScheme[];
  isShowingEdges: boolean;
  ranges?: { [key: string]: [number, number] };
  onColorSchemeSelect: (colorScheme?: ColorScheme) => void;
  onResetButtonClick: () => void;
  toggleEdges: () => void;
}
const GraphTools: React.FC<GraphToolsProps> = ({
  currentColorScheme,
  colorSchemes,
  isShowingEdges,
  ranges,
  onColorSchemeSelect,
  onResetButtonClick,
  toggleEdges,
}) => (
  <GraphToolsContainer>
    <GraphResetButton onClick={onResetButtonClick} />
    <GraphHideEdgesButton isShowingEdges={isShowingEdges} toggleEdges={toggleEdges} />
    <GraphKey
      current={currentColorScheme}
      colorSchemes={colorSchemes}
      onItemSelect={onColorSchemeSelect}
      ranges={ranges}
    />
  </GraphToolsContainer>
);
export default GraphTools;
