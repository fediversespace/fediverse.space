import * as React from 'react';
import { connect } from 'react-redux';
import { Sigma, SigmaEnableWebGL, Filter, ForceAtlas2 } from 'react-sigma';

import { selectAndLoadInstance } from '../redux/actions';
import ErrorState from './ErrorState';

const STYLE = {
    bottom: "0",
    left: "0",
    position: "absolute",
    right: "0",
    top: "50px",
}
const DEFAULT_NODE_COLOR = "#CED9E0";
const SELECTED_NODE_COLOR = "#48AFF0";
const SETTINGS = {
    defaultEdgeColor: "#5C7080",
    defaultLabelColor: "#F5F8FA",
    defaultNodeColor: DEFAULT_NODE_COLOR,
    drawEdges: true,
    drawLabels: true,
    edgeColor: "default",
    labelColor: "default",
    labelThreshold: 10,
    maxEdgeSize: 1,
    minEdgeSize: 0.3,
}

class GraphImpl extends React.Component {

    constructor(props) {
        super(props);
        this.sigmaComponent = React.createRef();
    }

    render() {
        let graph = this.props.graph;
        if (!graph) {
            return <ErrorState />;
        }
        // Check that all nodes have size & coordinates; otherwise the graph will look messed up
        const lengthBeforeFilter = graph.nodes.length;
        graph = {...graph, nodes: graph.nodes.filter(n => n.size && n.x && n.y)};
        if (graph.nodes.length !== lengthBeforeFilter) {
            // tslint:disable-next-line:no-console
            console.error("Some nodes were missing details: " + this.props.graph.nodes.filter(n => !n.size || !n.x || !n.y).map(n => n.label));
            return <ErrorState />;
        }
        return (
            <Sigma
                graph={graph}
                renderer="webgl"
                settings={SETTINGS}
                style={STYLE}
                onClickNode={this.onClickNode}
                onClickStage={this.onClickStage}
                ref={this.sigmaComponent}
            >
                <Filter neighborsOf={this.props.currentInstanceName} />
                <ForceAtlas2 iterationsPerRender={1} timeout={10000}/>
            </Sigma>
        )
    }

    componentDidUpdate() {
        const sigma = this.sigmaComponent && this.sigmaComponent.current.sigma;
        // Check if sigma exists s.t. nothing breaks if the graph didn't load (for whatever reason)
        if (sigma) {
            sigma.graph.nodes().map(this.colorNodes);
            sigma.refresh();
        }
    }

    onClickNode = (e) => {
        this.props.selectAndLoadInstance(e.data.node.label);
    }

    onClickStage = (e) => {
        // Deselect the instance (unless this was a drag event)
        if (!e.data.captor.isDragging) {
            this.props.selectAndLoadInstance(null);
        }
    }

    colorNodes = (n) => {
        if (this.props.currentInstanceName && n.id === this.props.currentInstanceName) {
            n.color = SELECTED_NODE_COLOR;
        } else {
            n.color = DEFAULT_NODE_COLOR;
        }
    }
}

const mapStateToProps = (state) => ({
    currentInstanceName: state.currentInstance.currentInstanceName,
    graph: state.data.graph,
})
const mapDispatchToProps = (dispatch) => ({
    selectAndLoadInstance: (instanceName) => dispatch(selectAndLoadInstance(instanceName)),
})
export const Graph = connect(mapStateToProps, mapDispatchToProps)(GraphImpl)
