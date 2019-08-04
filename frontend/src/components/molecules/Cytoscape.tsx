import cytoscape from "cytoscape";
import { isEqual } from "lodash";
import * as React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import tippy, { Instance } from "tippy.js";
import {
  DEFAULT_NODE_COLOR,
  HOVERED_NODE_COLOR,
  QUALITATIVE_COLOR_SCHEME,
  QUANTITATIVE_COLOR_SCHEME,
  SEARCH_RESULT_COLOR,
  SELECTED_NODE_COLOR
} from "../../constants";
import { IColorScheme } from "../../types";
import { getBuckets } from "../../util";

const CytoscapeContainer = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
`;

interface ICytoscapeProps {
  colorScheme?: IColorScheme;
  currentNodeId: string | null;
  elements: cytoscape.ElementsDefinition;
  hoveringOver?: string;
  ranges?: { [key: string]: [number, number] };
  searchResultIds?: string[];
  showEdges: boolean;
  navigateToInstancePath?: (domain: string) => void;
  navigateToRoot?: () => void;
}
class Cytoscape extends React.PureComponent<ICytoscapeProps> {
  private cy?: cytoscape.Core;

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
      minZoom: 0.02,
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
      .selector(".hidden") // used to hide nodes not in the neighborhood of the selected, or to hide edges
      .style({
        display: "none"
      })
      .selector(".thickEdge") // when a node is selected, make edges thicker so you can actually see them
      .style({
        width: 2
      });
    this.resetNodeColorScheme(style); // this function also called `update()`

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
    if (prevProps.colorScheme !== this.props.colorScheme) {
      this.updateColorScheme();
    }
    if (prevProps.hoveringOver !== this.props.hoveringOver) {
      this.updateHoveredNodeClass(prevProps.hoveringOver);
    }
    if (!isEqual(prevProps.searchResultIds, this.props.searchResultIds)) {
      this.updateSearchResultNodeClass();
    }
    if (prevProps.showEdges !== this.props.showEdges) {
      if (this.props.showEdges) {
        this.showEdges();
      } else {
        this.hideEdges();
      }
    }
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

  /**
   * Set the color scheme to the default. A style object can optionally be passed.
   * This is used during initilization to avoid having to do multiple renderings of the graph.
   */
  private resetNodeColorScheme = (style?: any) => {
    if (!style) {
      style = this.cy!.style() as any;
    }
    style = style.selector("node").style({
      "background-color": DEFAULT_NODE_COLOR,
      // The size from the backend is log_10(userCount), which from 10 <= userCount <= 1,000,000 gives us the range
      // 1-6. We map this to the range of sizes we want.
      // TODO: I should probably check that that the backend is actually using log_10 and not log_e, but it look
      // quite good as it is, so...
      height: "mapData(size, 1, 6, 20, 200)",
      label: "data(id)",
      width: "mapData(size, 1, 6, 20, 200)"
    });

    this.setNodeSearchColorScheme(style);
  };

  /**
   * We always want to set node search/hover styles at the end of a style change to make sure they don't get overwritten.
   */
  private setNodeSearchColorScheme = (style?: any) => {
    if (!style) {
      style = this.cy!.style() as any;
    }
    style
      .selector("node.searchResult")
      .style({
        "background-color": SEARCH_RESULT_COLOR,
        "border-color": SEARCH_RESULT_COLOR,
        "border-opacity": 0.7,
        "border-width": 250
      })
      .selector("node.hovered")
      .style({
        "border-color": HOVERED_NODE_COLOR,
        "border-width": 1000
      })
      .selector("node:selected")
      .style({
        "background-color": SELECTED_NODE_COLOR
      })
      .update();
  };

  private updateColorScheme = () => {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    const { colorScheme } = this.props;
    let style = this.cy.style() as any;
    if (!colorScheme) {
      this.resetNodeColorScheme();
      return;
    } else if (colorScheme.type === "qualitative") {
      colorScheme.values.forEach((v, idx) => {
        style = style.selector(`node[${colorScheme.cytoscapeDataKey} = '${v}']`).style({
          "background-color": QUALITATIVE_COLOR_SCHEME[idx]
        });
      });
    } else if (colorScheme.type === "quantitative") {
      const dataKey = colorScheme.cytoscapeDataKey;
      if (!this.props.ranges || !this.props.ranges[dataKey]) {
        throw new Error("Expected a range but did not receive one!");
      }
      // Create buckets for the range and corresponding classes
      const [minVal, maxVal] = this.props.ranges[dataKey];
      const buckets = getBuckets(minVal, maxVal, QUANTITATIVE_COLOR_SCHEME.length, colorScheme.exponential);

      QUANTITATIVE_COLOR_SCHEME.forEach((color, idx) => {
        const min = buckets[idx];
        // Make sure the max value is also included in a bucket!
        const max = idx === QUANTITATIVE_COLOR_SCHEME.length - 1 ? maxVal + 1 : buckets[idx + 1];
        const selector = `node[${dataKey} >= ${min}][${dataKey} < ${max}]`;
        style = style.selector(selector).style({
          "background-color": color
        });
      });
    }
    this.setNodeSearchColorScheme(style);
  };

  /**
   * This function sets the hover class on the node that's currently being hovered over in the search results
   * (and removes it from the previous one if there was one).
   *
   * We explicitly pass the ID of the previously hovered node, rather than just using a class selector.
   * This is because lookups by ID are significantly faster than class selectors.
   */
  private updateHoveredNodeClass = (prevHoveredId?: string) => {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    const { hoveringOver } = this.props;

    if (!!prevHoveredId) {
      this.cy.$id(prevHoveredId).removeClass("hovered");
    }
    if (!!hoveringOver) {
      this.cy.$id(hoveringOver).addClass("hovered");
    }
  };

  private updateSearchResultNodeClass = () => {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    const { searchResultIds } = this.props;

    this.cy.batch(() => {
      this.cy!.nodes().removeClass("searchResult");

      if (!!searchResultIds && searchResultIds.length > 0) {
        const currentResultSelector = searchResultIds.map(id => `node[id = "${id}"]`).join(", ");
        this.cy!.$(currentResultSelector).addClass("searchResult");
      }
    });
  };

  private showEdges = () => {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    this.cy.edges().removeClass("hidden");
  };

  private hideEdges = () => {
    if (!this.cy) {
      throw new Error("Expected cytoscape, but there wasn't one!");
    }
    this.cy.edges().addClass("hidden");
  };
}

export default Cytoscape;
