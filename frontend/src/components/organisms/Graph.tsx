import * as React from "react";
import { connect } from "react-redux";

import { push } from "connected-react-router";
import { Dispatch } from "redux";
import styled from "styled-components";
import { IAppState, IGraph } from "../../redux/types";
import { domainMatchSelector } from "../../util";
import { Cytoscape, ErrorState, FloatingResetButton } from "../molecules/";

const GraphDiv = styled.div`
  flex: 3;
`;

// TODO: merge this component with Cytoscape.tsx
interface IGraphProps {
  graph?: IGraph;
  currentInstanceName: string | null;
  navigate: (path: string) => void;
}
class GraphImpl extends React.Component<IGraphProps> {
  private cytoscapeComponent: React.RefObject<Cytoscape>;

  public constructor(props: IGraphProps) {
    super(props);
    this.cytoscapeComponent = React.createRef();
  }

  public render() {
    if (!this.props.graph) {
      return <ErrorState />;
    }

    return (
      <GraphDiv>
        <Cytoscape
          currentNodeId={this.props.currentInstanceName}
          elements={this.props.graph}
          navigateToInstancePath={this.navigateToInstancePath}
          navigateToRoot={this.navigateToRoot}
          ref={this.cytoscapeComponent}
        />
        <FloatingResetButton onClick={this.resetGraphPosition} />
      </GraphDiv>
    );
  }

  private resetGraphPosition = () => {
    if (this.cytoscapeComponent.current) {
      this.cytoscapeComponent.current.resetGraphPosition();
    }
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
    graph: state.data.graph
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigate: (path: string) => dispatch(push(path))
});
const Graph = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphImpl);
export default Graph;
