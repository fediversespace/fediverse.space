import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import styled from "styled-components";

import { Route, RouteComponentProps, Switch, withRouter } from "react-router";
import { InstanceScreen, SearchScreen } from ".";
import { INSTANCE_DOMAIN_PATH } from "../../constants";
import { loadInstance } from "../../redux/actions";
import { IAppState } from "../../redux/types";
import { domainMatchSelector, isSmallScreen } from "../../util";
import { Graph, SidebarContainer } from "../organisms/";

const GraphContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;
const FullDiv = styled.div`
  position: absolute;
  top: 50px;
  bottom: 0;
  left: 0;
  right: 0;
`;

interface IGraphScreenProps extends RouteComponentProps {
  currentInstanceName: string | null;
  pathname: string;
  graphLoadError: boolean;
  loadInstance: (domain: string | null) => void;
}
/**
 * This component takes care of loading or deselecting the current instance when the URL path changes.
 * It also handles changing and animating the screen shown in the sidebar.
 */
class GraphScreenImpl extends React.Component<IGraphScreenProps> {
  public render() {
    return <Route render={this.renderRoutes} />;
  }

  public componentDidMount() {
    this.loadCurrentInstance();
  }

  public componentDidUpdate(prevProps: IGraphScreenProps) {
    this.loadCurrentInstance(prevProps.currentInstanceName);
  }

  private renderRoutes = ({ location }: RouteComponentProps) => (
    <FullDiv>
      <GraphContainer>
        {/* Smaller screens never load the entire graph. Instead, `InstanceScreen` shows only the neighborhood. */}
        {isSmallScreen || <Graph />}
        <SidebarContainer>
          <Switch>
            <Route path={INSTANCE_DOMAIN_PATH} component={InstanceScreen} />
            <Route exact={true} path="/" component={SearchScreen} />
          </Switch>
        </SidebarContainer>
      </GraphContainer>
    </FullDiv>
  );

  private loadCurrentInstance = (prevInstanceName?: string | null) => {
    if (prevInstanceName !== this.props.currentInstanceName) {
      this.props.loadInstance(this.props.currentInstanceName);
    }
  };
}

const mapStateToProps = (state: IAppState) => {
  const match = domainMatchSelector(state);
  return {
    currentInstanceName: match && match.params.domain,
    graphLoadError: state.data.error,
    pathname: state.router.location.pathname
  };
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadInstance: (domain: string | null) => dispatch(loadInstance(domain) as any)
});
const GraphScreen = connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphScreenImpl);
export default withRouter(GraphScreen);
