import * as React from 'react';
import { connect } from 'react-redux';
import { RandomizeNodePositions, RelativeSize, Sigma, SigmaEnableWebGL, Filter } from 'react-sigma';

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
                onClickNode={(e) => this.props.selectAndLoadInstance(e.data.node.label)}
                onClickStage={(e) => this.props.selectAndLoadInstance(null)}
            >
                <RandomizeNodePositions />
                <Filter neighborsOf={this.props.currentInstanceName} />
                <RelativeSize initialSize={15} />
            </Sigma>
        )
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
