import React from "react";
import styled from "styled-components";
import { IColorScheme } from "../../types";
import { GraphHideEdgesButton, GraphKey, GraphResetButton } from "../atoms";

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
  isShowingEdges: boolean;
  ranges?: { [key: string]: [number, number] };
  onColorSchemeSelect: (colorScheme?: IColorScheme) => void;
  onResetButtonClick: () => void;
  toggleEdges: () => void;
}
const GraphTools: React.FC<IGraphToolsProps> = ({
  currentColorScheme,
  colorSchemes,
  isShowingEdges,
  ranges,
  onColorSchemeSelect,
  onResetButtonClick,
  toggleEdges
}) => {
  return (
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
};
export default GraphTools;
