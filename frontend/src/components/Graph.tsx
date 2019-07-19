import { get } from "lodash";
import * as React from "react";
import { connect } from "react-redux";

import { Dispatch } from "redux";
import { selectAndLoadInstance } from "../redux/actions";
import { IAppState, IGraph } from "../redux/types";
import Cytoscape from "./Cytoscape";
import { ErrorState } from "./ErrorState";
import { FloatingResetButton } from "./FloatingResetButton";

interface IGraphProps {
  graph?: IGraph;
  currentInstanceName: string | null;
  selectAndLoadInstance: (name: string) => void;
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
      <div>
        <Cytoscape
          elements={this.props.graph}
          onInstanceSelect={this.onInstanceSelect}
          onInstanceDeselect={this.onInstanceDeselect}
          ref={this.cytoscapeComponent}
        />
        <FloatingResetButton onClick={this.resetGraphPosition} />
      </div>
    );
  }

  public componentDidUpdate(prevProps: IGraphProps) {
    const { currentInstanceName } = this.props;
    if (prevProps.currentInstanceName !== currentInstanceName) {
      const cy = this.getCytoscape();
      cy.$id(prevProps.currentInstanceName).unselect();
      if (currentInstanceName) {
        // Select instance
        cy.$id(`${currentInstanceName}`).select();
        // Center it
        const selected = cy.$id(currentInstanceName);
        cy.center(selected);
      }
    }
  }

  private resetGraphPosition = () => {
    const cy = this.getCytoscape();
    const { currentInstanceName } = this.props;
    if (currentInstanceName) {
      cy.zoom({
        level: 0.2,
        position: cy.$id(currentInstanceName).position()
      });
    } else {
      cy.zoom({
        level: 0.2,
        position: { x: 0, y: 0 }
      });
    }
  };

  private onInstanceSelect = (domain: string) => {
    this.props.selectAndLoadInstance(domain);
  };

  private onInstanceDeselect = () => {
    this.props.selectAndLoadInstance("");
  };

  private getCytoscape = () => {
    const cy = get(this.cytoscapeComponent, "current.cy");
    if (!cy) {
      throw new Error("Expected cytoscape component but did not find one.");
    }
    return cy;
  };
}
const mapStateToProps = (state: IAppState) => ({
  currentInstanceName: state.currentInstance.currentInstanceName,
  graph: state.data.graph
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  selectAndLoadInstance: (instanceName: string) => dispatch(selectAndLoadInstance(instanceName) as any)
});
const Graph = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphImpl);
export default Graph;
