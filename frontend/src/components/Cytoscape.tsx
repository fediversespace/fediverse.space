import cytoscape from "cytoscape";
import popper from "cytoscape-popper";
import * as React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import tippy, { Instance } from "tippy.js";
import { DEFAULT_NODE_COLOR, SELECTED_NODE_COLOR } from "../constants";

const EntireWindowDiv = styled.div`
  position: absolute;
  top: 50px;
  bottom: 0;
  right: 0;
  left: 0;
`;

interface ICytoscapeProps {
  elements: cytoscape.ElementsDefinition;
  onInstanceSelect: (domain: string) => void;
  onInstanceDeselect: () => void;
}
class Cytoscape extends React.Component<ICytoscapeProps> {
  public cy?: cytoscape.Core;

  public componentDidMount() {
    const container = ReactDOM.findDOMNode(this);
    cytoscape.use(popper as any);
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
        "font-size": 50,
        "min-zoomed-font-size": 16
      })
      .selector(".hidden")
      .style({
        display: "none"
      })
      .selector(".thickEdge")
      .style({
        width: 2
      })
      .update();

    this.cy.nodes().on("select", e => {
      const instanceId = e.target.data("id");
      if (instanceId) {
        this.props.onInstanceSelect(instanceId);
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
      this.props.onInstanceDeselect();
      this.cy!.batch(() => {
        this.cy!.nodes().removeClass("hidden");
        this.cy!.edges().removeClass("thickEdge");
      });
    });
    this.cy.on("click", e => {
      // Clicking on the background should also deselect
      const target = e.target;
      if (!target) {
        this.props.onInstanceDeselect();
      }
      this.cy!.batch(() => {
        this.cy!.nodes().removeClass("hidden");
        this.cy!.edges().removeClass("thickEdge");
      });
    });
  }

  public componentWillUnmount() {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  public render() {
    return <EntireWindowDiv />;
  }
}

export default Cytoscape;
