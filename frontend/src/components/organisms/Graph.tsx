import * as React from "react";
import { connect } from "react-redux";

import { NonIdealState, Spinner } from "@blueprintjs/core";
import { push } from "connected-react-router";
import { Dispatch } from "redux";
import styled from "styled-components";
import { fetchGraph } from "../../redux/actions";
import { AppState, GraphResponse } from "../../redux/types";
import { colorSchemes, ColorScheme } from "../../types";
import { domainMatchSelector } from "../../util";
import { Cytoscape, ErrorState, GraphTools } from "../molecules";

const GraphDiv = styled.div`
  flex: 2;
`;

interface GraphProps {
  currentInstanceName: string | null;
  fetchGraph: () => void;
  graphResponse?: GraphResponse;
  graphLoadError: boolean;
  hoveringOverResult?: string;
  isLoadingGraph: boolean;
  searchResultDomains: string[];
  navigate: (path: string) => void;
}
interface GraphState {
  colorScheme?: ColorScheme;
  isShowingEdges: boolean;
}
class GraphImpl extends React.PureComponent<GraphProps, GraphState> {
  private cytoscapeComponent: React.RefObject<Cytoscape>;

  public constructor(props: GraphProps) {
    super(props);
    this.cytoscapeComponent = React.createRef();
    this.state = { colorScheme: undefined, isShowingEdges: true };
  }

  public componentDidMount() {
    this.loadGraph();
  }

  public render() {
    let content;
    if (this.props.isLoadingGraph) {
      content = <NonIdealState icon={<Spinner />} title="Loading..." />;
    } else if (this.props.graphLoadError || !this.props.graphResponse) {
      content = <ErrorState />;
    } else {
      content = (
        <>
          <Cytoscape
            colorScheme={this.state.colorScheme}
            currentNodeId={this.props.currentInstanceName}
            elements={this.props.graphResponse.graph}
            ranges={this.props.graphResponse.metadata.ranges}
            hoveringOver={this.props.hoveringOverResult}
            navigateToInstancePath={this.navigateToInstancePath}
            navigateToRoot={this.navigateToRoot}
            searchResultIds={this.props.searchResultDomains}
            showEdges={this.state.isShowingEdges}
            ref={this.cytoscapeComponent}
          />
          <GraphTools
            onResetButtonClick={this.resetGraphPosition}
            currentColorScheme={this.state.colorScheme}
            colorSchemes={colorSchemes}
            isShowingEdges={this.state.isShowingEdges}
            onColorSchemeSelect={this.setColorScheme}
            ranges={this.props.graphResponse.metadata.ranges}
            toggleEdges={this.toggleEdges}
          />
        </>
      );
    }

    return <GraphDiv aria-hidden>{content}</GraphDiv>;
  }

  private loadGraph = () => {
    if (!this.props.isLoadingGraph && !this.props.graphLoadError) {
      this.props.fetchGraph();
    }
  };

  private resetGraphPosition = () => {
    if (this.cytoscapeComponent.current) {
      this.cytoscapeComponent.current.resetGraphPosition();
    }
  };

  private toggleEdges = () => {
    this.setState({ isShowingEdges: !this.state.isShowingEdges });
  };

  private setColorScheme = (colorScheme?: ColorScheme) => {
    this.setState({ colorScheme });
  };

  private navigateToInstancePath = (domain: string) => {
    this.props.navigate(`/instance/${domain}`);
  };

  private navigateToRoot = () => {
    this.props.navigate("/");
  };
}
const mapStateToProps = (state: AppState) => {
  const match = domainMatchSelector(state);
  return {
    currentInstanceName: match && match.params.domain,
    graphLoadError: state.data.graphLoadError,
    graphResponse: state.data.graphResponse,
    hoveringOverResult: state.search.hoveringOverResult,
    isLoadingGraph: state.data.isLoadingGraph,
    searchResultDomains: state.search.results.map((r) => r.name),
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchGraph: () => dispatch(fetchGraph() as any),
  navigate: (path: string) => dispatch(push(path)),
});
const Graph = connect(mapStateToProps, mapDispatchToProps)(GraphImpl);
export default Graph;
