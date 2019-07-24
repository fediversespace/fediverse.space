import cytoscape from "cytoscape";
import * as React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import tippy, { Instance } from "tippy.js";
import { DEFAULT_NODE_COLOR, SELECTED_NODE_COLOR } from "../../constants";

const CytoscapeContainer = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
`;

interface ICytoscapeProps {
  currentNodeId: string | null;
  elements: cytoscape.ElementsDefinition;
  navigateToInstancePath?: (domain: string) => void;
  navigateToRoot?: () => void;
}
class Cytoscape extends React.Component<ICytoscapeProps> {
  private cy?: cytoscape.Core;

  public shouldComponentUpdate(prevProps: ICytoscapeProps) {
    // We only want to update this component if the current instance selection changes.
    // We know that the `elements` prop will never change so we skip the expensive computations here.
    return prevProps.currentNodeId !== this.props.currentNodeId;
  }

  public componentDidMount() {
    const container = ReactDOM.findDOMNode(this);
    this.cy = cytoscape({
      autoungrabify: true,
      container: container as any,
      elements: this.props.elements,
      hideEdgesOnViewport: true,
      hideLabelsOnViewport: true,
      layout: {
        name: "preset"
      },
      maxZoom: 2,
      minZoom: 0.03,
      pixelRatio: 1.0,
      selectionType: "single"
    });

    // Setup node tooltip on hover
    this.cy.nodes().forEach(n => {
      const domain = n.data("id");
      const ref = (n as any).popperRef();
      const t = tippy(ref, {
        animateFill: false,
        animation: "fade",
        content: domain,
        duration: 100,
        trigger: "manual"
      });
      n.on("mouseover", e => {
        (t as Instance).show();
      });
      n.on("mouseout", e => {
        (t as Instance).hide();
      });
    });

    const style = this.cy.style() as any;

    style
      .clear()
      .selector("node")
      .style({
        "background-color": DEFAULT_NODE_COLOR,
        // The size from the backend is log_10(userCount), which from 10 <= userCount <= 1,000,000 gives us the range
        // 1-6. We map this to the range of sizes we want.
        // TODO: I should probably check that that the backend is actually using log_10 and not log_e, but it look
        // quite good as it is, so...
        height: "mapData(size, 1, 6, 20, 200)",
        label: "data(id)",
        width: "mapData(size, 1, 6, 20, 200)"
      })
      .selector("node:selected")
      .style({
        "background-color": SELECTED_NODE_COLOR
      })
      .selector("edge")
      .style({
        "curve-style": "haystack", // fast edges
        "line-color": DEFAULT_NODE_COLOR,
        width: "mapData(weight, 0, 0.5, 1, 20)"
      })
      .selector("node[label]")
      .style({
        color: DEFAULT_NODE_COLOR,
        "font-size": "mapData(size, 1, 6, 10, 100)",
        "min-zoomed-font-size": 16
      })
      .selector(".hidden") // used to hide nodes not in the neighborhood of the selected
      .style({
        display: "none"
      })
      .selector(".thickEdge") // when a node is selected, make edges thicker so you can actually see them
      .style({
        width: 2
      })
      .update();

    this.cy.nodes().on("select", e => {
      const instanceId = e.target.data("id");
      if (instanceId && instanceId !== this.props.currentNodeId) {
        if (this.props.navigateToInstancePath) {
          this.props.navigateToInstancePath(instanceId);
        }
      }

      const neighborhood = this.cy!.$id(instanceId).closedNeighborhood();
      // Reset graph visibility
      this.cy!.batch(() => {
        this.cy!.nodes().removeClass("hidden");
        this.cy!.edges().removeClass("thickEdge");
        // Then hide everything except neighborhood
        this.cy!.nodes()
          .diff(neighborhood)
          .left.addClass("hidden");
        neighborhood.connectedEdges().addClass("thickEdge");
      });
    });
    this.cy.nodes().on("unselect", e => {
      this.cy!.batch(() => {
        this.cy!.nodes().removeClass("hidden");
        this.cy!.edges().removeClass("thickEdge");
      });
    });
    this.cy.on("click", e => {
      // Clicking on the background should also deselect
      const target = e.target;
      if (!target || target === this.cy || target.isEdge()) {
        if (this.props.navigateToRoot) {
          // Go to the URL "/"
          this.props.navigateToRoot();
        }
      }
    });

    this.setNodeSelection();
  }

  public componentDidUpdate(prevProps: ICytoscapeProps) {
    this.setNodeSelection(prevProps.currentNodeId);
  }

  public componentWillUnmount() {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  public render() {
    return <CytoscapeContainer />;
  }

  public resetGraphPosition() {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    const { currentNodeId } = this.props;
    if (currentNodeId) {
      this.cy.zoom({
        level: 0.2,
        position: this.cy.$id(currentNodeId).position()
      });
    } else {
      this.cy.zoom({
        level: 0.2,
        position: { x: 0, y: 0 }
      });
    }
  }

  /**
   * Updates cytoscape's internal state to match our props.
   */
  private setNodeSelection = (prevNodeId?: string | null) => {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    if (prevNodeId) {
      this.cy.$id(prevNodeId).unselect();
    }

    const { currentNodeId } = this.props;
    if (currentNodeId) {
      // Select instance
      this.cy.$id(currentNodeId).select();
      // Center it
      const selected = this.cy.$id(currentNodeId);
      this.cy.center(selected);
    }
  };
}

export default Cytoscape;
