import { Button, ButtonGroup, Code, HTMLTable, Intent, NonIdealState, Spinner } from "@blueprintjs/core";
import { push } from "connected-react-router";
import { range, sortBy, sortedUniq, zip } from "lodash";
import * as numeral from "numeral";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import styled from "styled-components";
import { loadInstanceList } from "../../redux/actions";
import { IAppState, IInstanceListResponse } from "../../redux/types";
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

interface IInstanceTableProps {
  loadError: boolean;
  instancesResponse?: IInstanceListResponse;
  isLoading: boolean;
  fetchInstances: (page?: number) => void;
  navigate: (path: string) => void;
}
class InstanceTable extends React.PureComponent<IInstanceTableProps> {
  public componentDidMount() {
    const { isLoading, instancesResponse, loadError } = this.props;
    if (!isLoading && !instancesResponse && !loadError) {
      this.props.fetchInstances();
    }
  }

  public render() {
    const { isLoading, instancesResponse, loadError } = this.props;
    if (loadError) {
      return <ErrorState />;
    } else if (isLoading || !instancesResponse) {
      return <NonIdealState icon={<Spinner />} />;
    }

    const { instances, pageNumber: currentPage, totalPages, totalEntries, pageSize } = instancesResponse!;
    const pagesToDisplay = this.getPagesToDisplay(totalPages, currentPage);

    return (
      <>
        <StyledTable striped={true} bordered={true} interactive={true}>
          <thead>
            <tr>
              <th>Instance</th>
              <th>Server type</th>
              <th>Version</th>
              <th>Users</th>
              <th>Statuses</th>
              <th>Insularity</th>
            </tr>
          </thead>
          <tbody>
            {instances.map(i => (
              <tr key={i.name} onClick={this.goToInstanceFactory(i.name)}>
                <td>{i.name}</td>
                <td>{i.type && <InstanceType type={i.type} />}</td>
                <td>{i.version && <Code>{i.version}</Code>}</td>
                <td>{i.userCount}</td>
                <td>{i.statusCount}</td>
                <td>{i.insularity && numeral.default(i.insularity).format("0.0%")}</td>
              </tr>
            ))}
          </tbody>
        </StyledTable>

        <PaginationContainer>
          <p>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalEntries)} of{" "}
            {totalEntries} known instances
          </p>

          <ButtonGroup>
            {zip(pagesToDisplay, pagesToDisplay.slice(1)).map(([page, nextPage], idx) => {
              if (page === undefined) {
                return;
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
                    <Button disabled={true} key={"..."}>
                      {"..."}
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

  private loadPageFactory = (page: number) => () => {
    this.props.fetchInstances(page);
  };

  private goToInstanceFactory = (domain: string) => () => {
    this.props.navigate(`/instance/${domain}`);
  };

  private getPagesToDisplay = (totalPages: number, currentPage: number) => {
    if (totalPages < 10) {
      return range(1, totalPages + 1);
    }

    const firstPages = range(1, 3);
    const surroundingPages = range(Math.max(currentPage - 1, 1), Math.min(currentPage + 2, totalPages));
    const lastPages = range(totalPages - 1, totalPages + 1);

    const pagesToDisplay = firstPages.concat(surroundingPages).concat(lastPages);

    return sortedUniq(sortBy(pagesToDisplay, n => n));
  };
}

const mapStateToProps = (state: IAppState) => {
  return {
    instancesResponse: state.data.instancesResponse,
    isLoading: state.data.isLoadingInstanceList,
    loadError: state.data.instanceListLoadError
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchInstances: (page?: number) => dispatch(loadInstanceList(page) as any),
  navigate: (path: string) => dispatch(push(path))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InstanceTable);
