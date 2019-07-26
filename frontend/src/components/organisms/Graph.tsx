import * as React from "react";
import { connect } from "react-redux";

import { NonIdealState, Spinner } from "@blueprintjs/core";
import { push } from "connected-react-router";
import { Dispatch } from "redux";
import styled from "styled-components";
import { fetchGraph } from "../../redux/actions";
import { IAppState, IGraph } from "../../redux/types";
import { colorSchemes, IColorSchemeType } from "../../types";
import { domainMatchSelector } from "../../util";
import { Cytoscape, ErrorState, GraphTools } from "../molecules/";

const GraphDiv = styled.div`
  flex: 2;
`;

interface IGraphProps {
  currentInstanceName: string | null;
  fetchGraph: () => void;
  graph?: IGraph;
  graphLoadError: boolean;
  hoveringOverResult?: string;
  isLoadingGraph: boolean;
  searchResultDomains: string[];
  navigate: (path: string) => void;
}
interface IGraphState {
  colorScheme?: IColorSchemeType;
}
class GraphImpl extends React.PureComponent<IGraphProps, IGraphState> {
  private cytoscapeComponent: React.RefObject<Cytoscape>;

  public constructor(props: IGraphProps) {
    super(props);
    this.cytoscapeComponent = React.createRef();
    this.state = { colorScheme: undefined };
  }

  public componentDidMount() {
    this.loadGraph();
  }

  public render() {
    let content;
    if (this.props.isLoadingGraph) {
      content = <NonIdealState icon={<Spinner />} title="Loading..." />;
    } else if (this.props.graphLoadError || !this.props.graph) {
      content = <ErrorState />;
    } else {
      content = (
        <>
          <Cytoscape
            colorScheme={this.state.colorScheme}
            currentNodeId={this.props.currentInstanceName}
            elements={this.props.graph}
            hoveringOver={this.props.hoveringOverResult}
            navigateToInstancePath={this.navigateToInstancePath}
            navigateToRoot={this.navigateToRoot}
            searchResultIds={this.props.searchResultDomains}
            ref={this.cytoscapeComponent}
          />
          <GraphTools
            onResetButtonClick={this.resetGraphPosition}
            currentColorScheme={this.state.colorScheme}
            colorSchemes={colorSchemes}
            onColorSchemeSelect={this.setColorScheme}
          />
        </>
      );
    }

    return <GraphDiv>{content}</GraphDiv>;
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

  private setColorScheme = (colorScheme?: IColorSchemeType) => {
    this.setState({ colorScheme });
  };

  private navigateToInstancePath = (domain: string) => {
    this.props.navigate(`/instance/${domain}`);
  };

  private navigateToRoot = () => {
    this.props.navigate("/");
  };
}
const mapStateToProps = (state: IAppState) => {
  const match = domainMatchSelector(state);
  return {
    currentInstanceName: match && match.params.domain,
    graph: state.data.graph,
    graphLoadError: state.data.error,
    hoveringOverResult: state.search.hoveringOverResult,
    isLoadingGraph: state.data.isLoadingGraph,
    searchResultDomains: state.search.results.map(r => r.name)
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchGraph: () => dispatch(fetchGraph() as any),
  navigate: (path: string) => dispatch(push(path))
});
const Graph = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphImpl);
export default Graph;
