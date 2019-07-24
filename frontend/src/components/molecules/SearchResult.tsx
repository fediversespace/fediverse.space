import { Card, Classes, Elevation, H4, Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import inflection from "inflection";
import * as numeral from "numeral";
import React from "react";
import sanitize from "sanitize-html";
import styled from "styled-components";
import { QUALITATIVE_COLOR_SCHEME } from "../../constants";
import { ISearchResultInstance } from "../../redux/types";
import { typeColorScheme } from "../../types";
import { capitalize } from "../../util";

const StyledCard = styled(Card)`
  width: 80%;
  margin: 1em auto;
  background-color: #394b59 !important;
  text-align: left;
`;
const StyledHeadingContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
`;
const StyledH4 = styled(H4)`
  margin: 0 5px 0 0;
  flex: 1;
`;
const StyledType = styled.div`
  margin: 0;
  align-self: flex-end;
`;
const StyledUserCount = styled.div`
  margin: 0;
`;
const StyledDescription = styled.div`
  margin-top: 10px;
`;
interface ISearchResultProps {
  result: ISearchResultInstance;
  onClick: () => void;
}
const SearchResult: React.FC<ISearchResultProps> = ({ result, onClick }) => {
  let shortenedDescription;
  if (result.description) {
    shortenedDescription = result.description && sanitize(result.description);
    if (shortenedDescription.length > 100) {
      shortenedDescription = shortenedDescription.substring(0, 100) + "...";
    }
  }

  let typeIcon;
  if (result.type) {
    const idx = typeColorScheme.values.indexOf(result.type);
    typeIcon = (
      <StyledType className={Classes.TEXT_MUTED}>
        <Icon icon={IconNames.SYMBOL_CIRCLE} color={QUALITATIVE_COLOR_SCHEME[idx]} />
        {" " + capitalize(result.type)}
      </StyledType>
    );
  }

  return (
    <StyledCard elevation={Elevation.ONE} interactive={true} key={result.name} onClick={onClick}>
      <StyledHeadingContainer>
        <StyledH4>{result.name}</StyledH4>
        {typeIcon}
      </StyledHeadingContainer>
      {result.userCount && (
        <StyledUserCount className={Classes.TEXT_MUTED}>
          {numeral.default(result.userCount).format("0,0")} {inflection.inflect("people", result.userCount, "person")}
        </StyledUserCount>
      )}
      {shortenedDescription && <StyledDescription dangerouslySetInnerHTML={{ __html: shortenedDescription }} />}
    </StyledCard>
  );
};
export default SearchResult;
