import { Button, Callout, H2, InputGroup, Intent, NonIdealState, Spinner } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { push } from "connected-react-router";
import { get, isEqual } from "lodash";
import React, { MouseEvent } from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import styled from "styled-components";
import { setResultHover, updateSearch } from "../../redux/actions";
import { IAppState, ISearchResultInstance } from "../../redux/types";
import { ISearchFilter } from "../../searchFilters";
import { isSmallScreen } from "../../util";
import { SearchResult } from "../molecules";
import { SearchFilters } from "../organisms";

interface ISearchBarContainerProps {
  hasSearchResults: boolean;
  hasError: boolean;
}
const SearchBarContainer = styled.div<ISearchBarContainerProps>`
  width: 80%;
  text-align: center;
  margin: ${props => (props.hasSearchResults || props.hasError ? "0 auto" : "auto")};
  align-self: center;
`;
const SearchResults = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-items: center;
`;
const StyledSpinner = styled(Spinner)`
  margin-top: 10px;
`;
const CalloutContainer = styled.div`
  width: 90%;
  margin: 0 auto 20px auto;
  text-align: left;
`;

interface ISearchScreenProps {
  error: boolean;
  isLoadingResults: boolean;
  query: string;
  hasMoreResults: boolean;
  results: ISearchResultInstance[];
  handleSearch: (query: string, filters: ISearchFilter[]) => void;
  navigateToInstance: (domain: string) => void;
  setIsHoveringOver: (domain?: string) => void;
}
interface ISearchScreenState {
  currentQuery: string;
  searchFilters: ISearchFilter[];
}
class SearchScreen extends React.PureComponent<ISearchScreenProps, ISearchScreenState> {
  public constructor(props: ISearchScreenProps) {
    super(props);
    this.state = { currentQuery: "", searchFilters: [] };
  }

  public componentDidMount() {
    if (this.props.query) {
      this.setState({ currentQuery: this.props.query });
    }
  }

  public render() {
    const { error, hasMoreResults, results, isLoadingResults, query } = this.props;

    let content;
    if (error) {
      content = <NonIdealState icon={IconNames.ERROR} title="Something went wrong." />;
    } else if (!isLoadingResults && query && results.length === 0) {
      content = (
        <NonIdealState
          icon={IconNames.SEARCH}
          title="No search results"
          description="Try searching for something else."
        />
      );
    } else if (!!results && results.length > 0) {
      content = (
        <SearchResults>
          {results.map(result => (
            <SearchResult
              result={result}
              key={result.name}
              onClick={this.selectInstanceFactory(result.name)}
              onMouseEnter={this.onMouseEnterFactory(result.name)}
              onMouseLeave={this.onMouseLeave}
            />
          ))}
          {isLoadingResults && <StyledSpinner size={Spinner.SIZE_SMALL} />}
          {!isLoadingResults && hasMoreResults && (
            <Button onClick={this.search} minimal={true}>
              Load more results
            </Button>
          )}
        </SearchResults>
      );
    }

    let rightSearchBarElement;
    if (isLoadingResults) {
      rightSearchBarElement = <Spinner size={Spinner.SIZE_SMALL} />;
    } else if (query || error) {
      rightSearchBarElement = (
        <Button minimal={true} icon={IconNames.CROSS} onClick={this.clearQuery} aria-label="Search" />
      );
    } else {
      rightSearchBarElement = (
        <Button
          minimal={true}
          icon={IconNames.ARROW_RIGHT}
          intent={Intent.PRIMARY}
          onClick={this.search}
          disabled={!this.state.currentQuery}
        />
      );
    }

    return (
      <>
        {isSmallScreen && results.length === 0 && this.renderMobileWarning()}
        <SearchBarContainer hasSearchResults={!!query && !!results} hasError={!!error}>
          <H2>Find an instance</H2>
          <InputGroup
            leftIcon={IconNames.SEARCH}
            rightElement={rightSearchBarElement}
            large={true}
            placeholder="Search instance names and descriptions"
            aria-label="Search instance names and descriptions"
            type="search"
            value={this.state.currentQuery}
            onChange={this.handleInputChange}
            onKeyPress={this.handleKeyPress}
          />
          <SearchFilters
            selectedFilters={this.state.searchFilters}
            selectFilter={this.selectSearchFilter}
            deselectFilter={this.deselectSearchFilter}
          />
        </SearchBarContainer>
        {content}
      </>
    );
  }

  private handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ currentQuery: event.currentTarget.value });
  };

  private handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && this.state.currentQuery !== this.props.query) {
      this.search();
    }
  };

  private search = () => {
    this.props.handleSearch(this.state.currentQuery, this.state.searchFilters);
  };

  private clearQuery = () => {
    this.setState({ currentQuery: "" }, () => this.props.handleSearch("", []));
  };

  private selectSearchFilter = (filter: ISearchFilter) => {
    const { searchFilters } = this.state;
    // Don't add the same filters twice
    if (searchFilters.some(sf => isEqual(sf, filter))) {
      return;
    }
    this.setState({ searchFilters: [...searchFilters, filter] }, this.search);
  };

  private deselectSearchFilter = (e: MouseEvent<HTMLButtonElement>) => {
    const { searchFilters } = this.state;
    const displayValueToRemove = get(e, "currentTarget.parentElement.innerText", "");
    if (!!displayValueToRemove) {
      this.setState(
        { searchFilters: searchFilters.filter(sf => sf.displayValue !== displayValueToRemove) },
        this.search
      );
    }
  };

  private selectInstanceFactory = (domain: string) => () => {
    this.props.setIsHoveringOver(undefined);
    this.props.navigateToInstance(domain);
  };

  private onMouseEnterFactory = (domain: string) => () => {
    this.props.setIsHoveringOver(domain);
  };

  private onMouseLeave = () => {
    this.props.setIsHoveringOver(undefined);
  };

  private renderMobileWarning = () => (
    <CalloutContainer>
      <Callout intent={Intent.WARNING} title="Desktop site">
        This is a desktop-optimized site with large visualizations. You can view a simplified version on smaller
        devices, but for the full experience, open it on a computer.
      </Callout>
    </CalloutContainer>
  );
}

const mapStateToProps = (state: IAppState) => ({
  error: state.search.error,
  hasMoreResults: !!state.search.next,
  isLoadingResults: state.search.isLoadingResults,
  query: state.search.query,
  results: state.search.results
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  handleSearch: (query: string, filters: ISearchFilter[]) => dispatch(updateSearch(query, filters) as any),
  navigateToInstance: (domain: string) => dispatch(push(`/instance/${domain}`)),
  setIsHoveringOver: (domain?: string) => dispatch(setResultHover(domain))
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchScreen);
