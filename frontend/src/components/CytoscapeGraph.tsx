import cytoscape from "cytoscape";
// import cola from "cytoscape-cola";
import * as React from "react";
import { connect } from "react-redux";

import { Dispatch } from "redux";
import styled from "styled-components";
import { DEFAULT_NODE_COLOR, SELECTED_NODE_COLOR } from "../constants";
import { selectAndLoadInstance } from "../redux/actions";
import { IAppState, IGraph } from "../redux/types";
import { ErrorState } from "./ErrorState";
// import { FloatingLayoutSelect } from "./FloatingLayoutSelect";
import { FloatingResetButton } from "./FloatingResetButton";

interface IGraphProps {
  graph?: IGraph;
  currentInstanceName: string | null;
  selectAndLoadInstance: (name: string) => void;
}
interface IGraphState {
  layoutAlgorithm: string;
  isLayouting: boolean;
  didError: boolean;
}
class GraphImpl extends React.Component<IGraphProps, IGraphState> {
  private cy?: cytoscape.Core;
  // private layout?: cytoscape.Layouts;
  private cytoscapeDiv: React.RefObject<HTMLElement>;

  public constructor(props: IGraphProps) {
    super(props);
    this.cytoscapeDiv = React.createRef();
    this.state = { layoutAlgorithm: "cola", isLayouting: false, didError: false };
  }

  public render() {
    if (this.state.didError) {
      return <ErrorState />;
    }

    const FullDiv = styled.div`
      position: absolute;
      top: 50px;
      bottom: 0;
      right: 0;
      left: 0;
    `;

    return (
      <div>
        <FullDiv id="cytoscape" ref={this.cytoscapeDiv as any} />
        {/* <FloatingLayoutSelect
          onItemSelect={this.handleLayoutSelect}
          currentLayoutKey={this.state.layoutAlgorithm}
          startLayout={this.startLayout}
          stopLayout={this.stopLayout}
        /> */}
        <FloatingResetButton onClick={this.resetGraph} />
      </div>
    );
  }

  public componentDidMount() {
    let { graph } = this.props;
    if (!graph) {
      this.setState({ didError: true });
      return;
    }

    // Check that all nodes have size & coordinates; otherwise the graph will look messed up
    const lengthBeforeFilter = graph.nodes.length;
    graph = { ...graph, nodes: graph.nodes.filter(n => n.data.size && n.position.x && n.position.y) };
    if (graph.nodes.length !== lengthBeforeFilter) {
      // tslint:disable-next-line:no-console
      console.error(
        "Some nodes were missing details: " +
          graph.nodes.filter(n => !n.data.size || !n.position.x || !n.position.y).map(n => n.data.label)
      );
      this.setState({ didError: true });
    }

    // cytoscape.use(cola as any);
    this.initGraph();
  }

  public componentDidUpdate() {
    this.initGraph();
  }

  // private handleLayoutSelect = (layout: string) => {
  //   this.setState({ layoutAlgorithm: layout });
  // };

  // private startLayout = () => {
  //   if (!this.cy) {
  //     return;
  //   }
  //   const options = {
  //     cola: {
  //       animate: true,
  //       convergenceThreshold: 0.1,
  //       edgeLength: (edge: any) => 1 / edge.data("weight"),
  //       name: "cola"
  //     },
  //     cose: {
  //       animate: false,
  //       idealEdgeLength: (edge: any) => 1 / edge.data("weight"),
  //       name: "cose",
  //       numIter: 100
  //     }
  //   };
  //   this.layout = this.cy.layout(options[this.state.layoutAlgorithm] as any);
  //   this.layout.run();
  // };

  // private stopLayout = () => {
  //   if (!this.layout) {
  //     return;
  //   }
  //   this.layout.stop();
  // };

  private initGraph = () => {
    const { graph } = this.props;
    if (this.state.didError || !graph) {
      return;
    }
    this.cy = cytoscape({
      autoungrabify: false,
      container: this.cytoscapeDiv.current,
      elements: {
        edges: graph.edges.map(e => ({
          ...e,
          data: {
            ...e.data,
            weight: Math.min(Math.max(e.data.weight * 100, 2), 10)
          },
          selectable: false
        })),
        nodes: graph.nodes.map(n => ({
          ...n,
          data: {
            ...n.data,
            size: Math.min(Math.max(n.data.size * 10, 10), 80)
          }
        }))
      },
      layout: {
        name: "preset"
      },
      selectionType: "single",
      style: [
        {
          selector: "node:selected",
          style: {
            "background-color": SELECTED_NODE_COLOR,
            label: "data(id)"
          }
        },
        {
          selector: "node",
          style: {
            "background-color": DEFAULT_NODE_COLOR,
            height: "data(size)",
            label: "data(id)",
            width: "data(size)"
          }
        },
        {
          selector: "edge",
          style: {
            width: "data(weight)"
          }
        },
        {
          selector: "label",
          style: {
            color: DEFAULT_NODE_COLOR
          }
        }
      ]
    });
    this.cy.nodes().on("select", e => {
      const instanceId = e.target.data("id");
      if (instanceId) {
        // console.log(`selecting ${instanceId}`);
        // console.log(`now selected: ${this.cy && this.cy.$(":selected")}`);
        this.props.selectAndLoadInstance(instanceId);
      }
    });
    this.cy.nodes().on("unselect", e => {
      const instanceId = e.target.data("id");
      if (instanceId) {
        // console.log(`unselecting ${instanceId}`);
        this.props.selectAndLoadInstance("");
      }
    });
  };

  private resetGraph = () => {
    if (!this.cy) {
      return;
    }
    this.cy.reset();
  };
}

const mapStateToProps = (state: IAppState) => ({
  currentInstanceName: state.currentInstance.currentInstanceName,
  graph: state.data.graph
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
  selectAndLoadInstance: (instanceName: string) => dispatch(selectAndLoadInstance(instanceName) as any)
});
export const CytoscapeGraph = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphImpl);
