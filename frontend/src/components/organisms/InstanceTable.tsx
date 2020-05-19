import { Button, ButtonGroup, Code, HTMLTable, Intent, NonIdealState, Spinner } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { push } from "connected-react-router";
import { range, sortBy, sortedUniq, zip } from "lodash";
import * as numeral from "numeral";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import styled from "styled-components";
import { loadInstanceList } from "../../redux/actions";
import { AppState, InstanceListResponse, InstanceSort, SortField, InstanceDetails } from "../../redux/types";
import { InstanceType } from "../atoms";
import { ErrorState } from "../molecules";

const StyledTable = styled(HTMLTable)`
  width: 100%;
`;
const PaginationContainer = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
`;
const InstanceColumn = styled.th`
  width: 15%;
`;
const ServerColumn = styled.th`
  width: 20%;
`;
const VersionColumn = styled.th`
  width: 20%;
`;
const UserCountColumn = styled.th`
  width: 15%;
`;
const StatusCountColumn = styled.th`
  width: 15%;
`;
const InsularityColumn = styled.th`
  width: 15%;
`;

interface InstanceTableProps {
  loadError: boolean;
  instancesResponse?: InstanceListResponse;
  instanceListSort: InstanceSort;
  isLoading: boolean;
  loadInstanceList: (page?: number, sort?: InstanceSort) => void;
  navigate: (path: string) => void;
}
class InstanceTable extends React.PureComponent<InstanceTableProps> {
  public componentDidMount() {
    const { isLoading, instancesResponse, loadError } = this.props;
    if (!isLoading && !instancesResponse && !loadError) {
      this.props.loadInstanceList();
    }
  }

  public render() {
    const { isLoading, instancesResponse, loadError } = this.props;
    if (loadError) {
      return <ErrorState />;
    }
    if (isLoading || !instancesResponse) {
      return <NonIdealState icon={<Spinner />} />;
    }

    const { instances, pageNumber: currentPage, totalPages, totalEntries, pageSize } = instancesResponse;
    const pagesToDisplay = this.getPagesToDisplay(totalPages, currentPage);

    return (
      <>
        <StyledTable striped bordered interactive>
          <thead>
            <tr>
              <InstanceColumn>
                Instance
                <Button
                  minimal
                  icon={this.getSortIcon("domain")}
                  onClick={this.sortByFactory("domain")}
                  intent={this.getSortIntent("domain")}
                />
              </InstanceColumn>
              <ServerColumn>Server type</ServerColumn>
              <VersionColumn>Version</VersionColumn>
              <UserCountColumn>
                Users
                <Button
                  minimal
                  icon={this.getSortIcon("userCount")}
                  onClick={this.sortByFactory("userCount")}
                  intent={this.getSortIntent("userCount")}
                />
              </UserCountColumn>
              <StatusCountColumn>
                Statuses
                <Button
                  minimal
                  icon={this.getSortIcon("statusCount")}
                  onClick={this.sortByFactory("statusCount")}
                  intent={this.getSortIntent("statusCount")}
                />
              </StatusCountColumn>
              <InsularityColumn>
                Insularity
                <Button
                  minimal
                  icon={this.getSortIcon("insularity")}
                  onClick={this.sortByFactory("insularity")}
                  intent={this.getSortIntent("insularity")}
                />
              </InsularityColumn>
            </tr>
          </thead>
          <tbody>
            {instances.map((i: InstanceDetails) => (
              <tr key={i.name} onClick={this.goToInstanceFactory(i.name)}>
                <td>{i.name}</td>
                <td>{i.type && <InstanceType type={i.type} />}</td>
                <td>{i.version && <Code>{i.version}</Code>}</td>
                <td>{i.userCount && numeral.default(i.userCount).format("0,0")}</td>
                <td>{i.statusCount && numeral.default(i.statusCount).format("0,0")}</td>
                <td>{i.insularity && numeral.default(i.insularity).format("0.0%")}</td>
              </tr>
            ))}
          </tbody>
        </StyledTable>

        <PaginationContainer>
          <p>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalEntries)} of{" "}
            {totalEntries} known active instances
          </p>

          <ButtonGroup>
            {zip(pagesToDisplay, pagesToDisplay.slice(1)).map(([page, nextPage]) => {
              if (page === undefined) {
                return null;
              }
              const isCurrentPage = currentPage === page;
              const isEndOfSection = nextPage !== undefined && page + 1 !== nextPage && page !== totalPages;

              return (
                <>
                  <Button
                    key={page}
                    onClick={this.loadPageFactory(page)}
                    disabled={isCurrentPage}
                    intent={isCurrentPage ? Intent.PRIMARY : undefined}
                  >
                    {page}
                  </Button>
                  {isEndOfSection && (
                    <Button disabled key="...">
                      ...
                    </Button>
                  )}
                </>
              );
            })}
          </ButtonGroup>
        </PaginationContainer>
      </>
    );
  }

  private sortByFactory = (field: SortField) => () => {
    const { instancesResponse, instanceListSort } = this.props;

    const page = (instancesResponse && instancesResponse.pageNumber) || 1;
    const nextSortDirection =
      instanceListSort.field === field && instanceListSort.direction === "desc" ? "asc" : "desc";

    this.props.loadInstanceList(page, { field, direction: nextSortDirection });
  };

  private loadPageFactory = (page: number) => () => {
    this.props.loadInstanceList(page);
  };

  private goToInstanceFactory = (domain: string) => () => {
    this.props.navigate(`/instance/${domain}`);
  };

  private getSortIcon = (field: SortField) => {
    const { instanceListSort } = this.props;
    if (instanceListSort.field !== field) {
      return IconNames.SORT;
    }
    if (instanceListSort.direction === "asc") {
      return IconNames.SORT_ASC;
    }
    return IconNames.SORT_DESC;
  };

  private getSortIntent = (field: SortField) => {
    const { instanceListSort } = this.props;
    if (instanceListSort.field === field) {
      return Intent.PRIMARY;
    }
    return Intent.NONE;
  };

  private getPagesToDisplay = (totalPages: number, currentPage: number) => {
    if (totalPages < 10) {
      return range(1, totalPages + 1);
    }

    const firstPages = range(1, 3);
    const surroundingPages = range(Math.max(currentPage - 1, 1), Math.min(currentPage + 2, totalPages));
    const lastPages = range(totalPages - 1, totalPages + 1);

    const pagesToDisplay = firstPages.concat(surroundingPages).concat(lastPages);

    return sortedUniq(sortBy(pagesToDisplay, (n) => n));
  };
}

const mapStateToProps = (state: AppState) => ({
  instanceListSort: state.data.instanceListSort,
  instancesResponse: state.data.instancesResponse,
  isLoading: state.data.isLoadingInstanceList,
  loadError: state.data.instanceListLoadError,
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadInstanceList: (page?: number, sort?: InstanceSort) => dispatch(loadInstanceList(page, sort) as any),
  navigate: (path: string) => dispatch(push(path)),
});

export default connect(mapStateToProps, mapDispatchToProps)(InstanceTable);
