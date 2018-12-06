import * as React from 'react';
import { connect } from 'react-redux';
import { Sigma, SigmaEnableWebGL, Filter, ForceAtlas2 } from 'react-sigma';

import { selectAndLoadInstance } from '../redux/actions';

const STYLE = {
    bottom: "0",
    left: "0",
    position: "absolute",
    right: "0",
    top: "50px",
}
const SETTINGS = {
    defaultEdgeColor: "#5C7080",
    defaultLabelColor: "#F5F8FA",
    defaultNodeColor: "#CED9E0",
    drawEdges: true,
    drawLabels: true,
    edgeColor: "default",
    labelColor: "default",
    labelThreshold: 10,
    maxEdgeSize: 1,
    minEdgeSize: 0.3,
}

class GraphImpl extends React.Component {

    render() {
        let graph = this.props.graph;
        if (!graph) {
            // TODO: error state
            return null;
        }
        // Check that all nodes have size & coordinates; otherwise the graph will look messed up
        const lengthBeforeFilter = graph.nodes.length;
        graph = {...graph, nodes: graph.nodes.filter(n => n.size && n.x && n.y)};
        if (graph.nodes.length !== lengthBeforeFilter) {
            // tslint:disable-next-line:no-console
            console.error("Some nodes were missing details: " + this.props.graph.nodes.filter(n => !n.size || !n.x || !n.y).map(n => n.label));
        }
        return (
            <Sigma
                graph={graph}
                renderer="webgl"
                settings={SETTINGS}
                style={STYLE}
                onClickNode={(e) => this.props.selectAndLoadInstance(e.data.node.label)}
                onClickStage={this.onClickStage}
            >
                <Filter neighborsOf={this.props.currentInstanceName} />
                <ForceAtlas2 iterationsPerRender={1} timeout={6000}/>
            </Sigma>
        )
    }

    onClickStage = (e) => {
        // Deselect the instance (unless this was a drag event)
        if (!e.data.captor.isDragging) {
            this.props.selectAndLoadInstance(null);
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
