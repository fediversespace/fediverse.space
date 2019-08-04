import { Button, ITagProps, Menu, MenuItem, Popover, Position, Tag } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import React, { MouseEvent } from "react";
import styled from "styled-components";
import { INSTANCE_TYPES } from "../../constants";
import { getSearchFilterDisplayValue, ISearchFilter } from "../../searchFilters";
import { capitalize } from "../../util";

const SearchFilterContainer = styled.div`
  margin: 10px 0 0 0;
`;
const TagContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-items: flex-start;
  margin-bottom: 5px;
`;
const StyledTag = styled(Tag)`
  margin-left: 5px;
`;

interface ISearchFiltersProps {
  selectedFilters: ISearchFilter[];
  selectFilter: (filter: ISearchFilter) => void;
  deselectFilter: (e: MouseEvent<HTMLButtonElement>, props: ITagProps) => void;
}
const SearchFilters: React.FC<ISearchFiltersProps> = ({ selectedFilters, selectFilter, deselectFilter }) => {
  const hasInstanceTypeFilter = selectedFilters.some(sf => sf.field === "type");

  const handleSelectInstanceType = (e: MouseEvent<HTMLElement>) => {
    const field = "type";
    const relation = "eq";
    const value = e.currentTarget.innerText.toLowerCase();
    const filter: ISearchFilter = {
      displayValue: getSearchFilterDisplayValue(field, relation, value),
      field,
      relation,
      value
    };
    selectFilter(filter);
  };
  const renderMenu = () => (
    <Menu>
      <MenuItem icon={IconNames.SYMBOL_CIRCLE} text="Instance type" disabled={hasInstanceTypeFilter}>
        {INSTANCE_TYPES.map(t => (
          <MenuItem key={t} text={capitalize(t)} onClick={handleSelectInstanceType} />
        ))}
      </MenuItem>
    </Menu>
  );
  return (
    <SearchFilterContainer>
      <TagContainer>
        {selectedFilters.map(filter => (
          <StyledTag key={filter.displayValue} minimal={true} onRemove={deselectFilter}>
            {filter.displayValue}
          </StyledTag>
        ))}
      </TagContainer>
      <Popover autoFocus={false} content={renderMenu()} position={Position.BOTTOM}>
        <Button minimal={true} icon={IconNames.FILTER}>
          {"Add filter"}
        </Button>
      </Popover>
    </SearchFilterContainer>
  );
};
export default SearchFilters;
