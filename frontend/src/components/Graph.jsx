import * as React from 'react';
import { connect } from 'react-redux';
import { NodeShapes, RandomizeNodePositions, RelativeSize, Sigma, SigmaEnableWebGL, LoadGEXF, Filter } from 'react-sigma';

import { selectInstance } from '../redux/actions';

const STYLE = {
    bottom: "0",
    left: "0",
    position: "absolute",
    right: "0",
    top: "50px",
}
const SETTINGS = {
    defaultEdgeColor: "#5C7080",
    defaultNodeColor: "#CED9E0",
    drawEdges: true,
    drawLabels: true,
    edgeColor: "default",
}

class GraphImpl extends React.Component {

    render() {
        if (!this.props.graph) {
            return null;
        }
        return (
            <Sigma
                graph={this.props.graph}
                renderer="webgl"
                settings={SETTINGS}
                style={STYLE}
                onClickNode={(e) => this.props.selectInstance(e.data.node.label)}
                onClickStage={(e) => this.props.selectInstance(null)}
            >
                <RandomizeNodePositions />
                <Filter neighborsOf={this.props.currentInstanceName} />
                <RelativeSize initialSize={15} />
            </Sigma>
        )
    }

    // onClickNode = (e) => {
    //     this.props.selectInstance(e.data.node.label);
    // }

    // zoomToNode = (camera, node) => {
    //     s
    // }
}

const mapStateToProps = (state) => ({
    currentInstanceName: state.currentInstanceName,
    graph: state.data.graph,
})
const mapDispatchToProps = (dispatch) => ({
    selectInstance: (instanceName) => dispatch(selectInstance(instanceName)),
})
export const Graph = connect(mapStateToProps, mapDispatchToProps)(GraphImpl)
