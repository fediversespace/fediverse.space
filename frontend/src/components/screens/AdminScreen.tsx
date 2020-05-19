import { Button, FormGroup, H1, H2, Intent, NonIdealState, Spinner, Switch } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { Dispatch } from "redux";
import styled from "styled-components";
import AppToaster from "../../toaster";
import { getAuthToken, getFromApi, postToApi, unsetAuthToken } from "../../util";
import { Page } from "../atoms";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
`;

interface AdminSettings {
  domain: string;
  optIn: boolean;
  optOut: boolean;
  userCount: number;
  statusCount: number;
}

interface AdminScreenProps {
  navigate: (path: string) => void;
}
interface AdminScreenState {
  settings?: AdminSettings;
  isUpdating: boolean;
}
class AdminScreen extends React.PureComponent<AdminScreenProps, AdminScreenState> {
  private authToken = getAuthToken();

  public constructor(props: AdminScreenProps) {
    super(props);
    this.state = { isUpdating: false };
  }

  public componentDidMount() {
    // Load instance settings from server
    if (this.authToken) {
      getFromApi(`admin`, this.authToken)
        .then((response) => {
          this.setState({ settings: response });
        })
        .catch(() => {
          AppToaster.show({
            icon: IconNames.ERROR,
            intent: Intent.DANGER,
            message: "Failed to load settings.",
            timeout: 0,
          });
          unsetAuthToken();
        });
    }
  }

  public render() {
    if (!this.authToken) {
      return <Redirect to="/admin/login" />;
    }
    const { settings, isUpdating } = this.state;
    let content;
    if (!settings) {
      content = <NonIdealState icon={<Spinner />} />;
    } else {
      content = (
        <>
          <H2>{settings.domain}</H2>
          <p>{`${settings.userCount} users with ${settings.statusCount || "(unknown)"} statuses.`}</p>
          <form onSubmit={this.updateSettings}>
            {settings.userCount < 10 && (
              <FormGroup helperText="Check this if you'd like your personal instance to be crawled by fediverse.space. This takes up to 24 hours to take effect.">
                <Switch
                  id="opt-in-switch"
                  checked={!!settings.optIn}
                  large
                  label="Opt in"
                  disabled={!!isUpdating}
                  onChange={this.updateOptIn}
                />
              </FormGroup>
            )}
            <FormGroup helperText="Check this if you don't want to your instance to be crawled. You won't appear on fediverse.space. The change is immediate.">
              <Switch
                id="opt-out-switch"
                checked={!!settings.optOut}
                large
                label="Opt out"
                disabled={!!isUpdating}
                onChange={this.updateOptOut}
              />
            </FormGroup>
            <ButtonContainer>
              <Button intent={Intent.PRIMARY} type="submit" loading={!!isUpdating}>
                Update settings
              </Button>
              <Button intent={Intent.DANGER} onClick={this.logout} icon={IconNames.LOG_OUT}>
                Log out
              </Button>
            </ButtonContainer>
          </form>
        </>
      );
    }
    return (
      <Page>
        <H1>Instance administration</H1>
        {content}
      </Page>
    );
  }

  private updateOptIn = (e: React.FormEvent<HTMLInputElement>) => {
    const settings = this.state.settings as AdminSettings;
    const optIn = e.currentTarget.checked;
    let { optOut } = settings;
    if (optIn) {
      optOut = false;
    }
    this.setState({ settings: { ...settings, optIn, optOut } });
  };

  private updateOptOut = (e: React.FormEvent<HTMLInputElement>) => {
    const settings = this.state.settings as AdminSettings;
    const optOut = e.currentTarget.checked;
    let { optIn } = settings;
    if (optOut) {
      optIn = false;
    }
    this.setState({ settings: { ...settings, optIn, optOut } });
  };

  private updateSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({ isUpdating: true });
    const body = {
      optIn: this.state.settings!.optIn,
      optOut: this.state.settings!.optOut,
    };
    postToApi(`admin`, body, this.authToken!)
      .then((response) => {
        this.setState({ settings: response, isUpdating: false });
        AppToaster.show({
          icon: IconNames.TICK,
          intent: Intent.SUCCESS,
          message: "Successfully updated settings.",
        });
      })
      .catch(() => {
        this.setState({ isUpdating: false });
        AppToaster.show({ intent: Intent.DANGER, icon: IconNames.ERROR, message: "Failed to update settings." });
      });
  };

  private logout = () => {
    unsetAuthToken();
    AppToaster.show({
      icon: IconNames.LOG_OUT,
      message: "Logged out.",
    });
    this.props.navigate("/admin/login");
  };
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigate: (path: string) => dispatch(push(path)),
});
export default connect(undefined, mapDispatchToProps)(AdminScreen);
