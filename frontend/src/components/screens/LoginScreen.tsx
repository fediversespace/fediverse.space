import { Button, Classes, FormGroup, H1, H4, Icon, InputGroup, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import React from "react";
import { Redirect } from "react-router";
import styled from "styled-components";
import { getAuthToken, getFromApi, postToApi } from "../../util";
import { Page } from "../atoms";
import { ErrorState } from "../molecules";

interface IFormContainerProps {
  error: boolean;
}
const FormContainer = styled.div<IFormContainerProps>`
  ${props => (props.error ? "margin: 20px auto 0 auto;" : "margin-top: 20px;")}
`;
const LoginTypeContainer = styled.div`
  display: flex;
  width: 100%;
`;
const LoginTypeButton = styled(Button)`
  flex: 1;
  margin: 0 10px;
`;
const PostLoginContainer = styled.div`
  align-self: center;
  text-align: center;
  margin-top: 20px;
`;
const StyledIcon = styled(Icon)`
  margin-bottom: 10px;
`;

interface ILoginTypes {
  domain: string;
  email?: string;
  fediverseAccount?: string;
}
interface ILoginScreenState {
  domain: string;
  isGettingLoginTypes: boolean;
  isSendingLoginRequest: boolean;
  loginTypes?: ILoginTypes;
  selectedLoginType?: "email" | "fediverseAccount";
  error: boolean;
}
class LoginScreen extends React.PureComponent<{}, ILoginScreenState> {
  public constructor(props: any) {
    super(props);
    this.state = { domain: "", error: false, isGettingLoginTypes: false, isSendingLoginRequest: false };
  }

  public render() {
    const authToken = getAuthToken();
    if (authToken) {
      return <Redirect to="/admin" />;
    }

    const { error, loginTypes, isSendingLoginRequest, selectedLoginType } = this.state;

    let content;
    if (!!error) {
      content = (
        <ErrorState description="This could be because the instance is down. If not, please reload the page and try again." />
      );
    } else if (!!selectedLoginType && !isSendingLoginRequest) {
      content = this.renderPostLogin();
    } else if (!!loginTypes) {
      content = this.renderChooseLoginType();
    } else {
      content = this.renderChooseInstance();
    }

    return (
      <Page>
        <H1>Login</H1>
        <p className={Classes.RUNNING_TEXT}>
          To manage how fediverse.space interacts with your instance, you must be the instance admin.
        </p>
        <FormContainer error={this.state.error}>{content}</FormContainer>
      </Page>
    );
  }

  private renderChooseInstance = () => {
    const { isGettingLoginTypes } = this.state;
    return (
      <form onSubmit={this.getLoginTypes}>
        <FormGroup label="Instance domain" labelFor="domain-input" disabled={isGettingLoginTypes} inline={true}>
          <InputGroup
            disabled={isGettingLoginTypes}
            id="domain-input"
            value={this.state.domain}
            onChange={this.updateDomainInState}
            rightElement={
              <Button
                intent={Intent.PRIMARY}
                minimal={true}
                rightIcon={IconNames.ARROW_RIGHT}
                title="submit"
                loading={isGettingLoginTypes}
              />
            }
            placeholder="mastodon.social"
          />
        </FormGroup>
      </form>
    );
  };

  private renderChooseLoginType = () => {
    const { loginTypes, isSendingLoginRequest } = this.state;
    if (!loginTypes) {
      return;
    }
    const loginWithEmail = () => this.login("email");
    // const loginWithDm = () => this.login("fediverseAccount");
    return (
      <>
        <H4>Choose an authentication method</H4>
        <LoginTypeContainer>
          {loginTypes.email && (
            <LoginTypeButton
              large={true}
              icon={IconNames.ENVELOPE}
              onClick={loginWithEmail}
              loading={!!isSendingLoginRequest}
            >
              {`Email ${loginTypes.email}`}
            </LoginTypeButton>
          )}
          {/* {loginTypes.fediverseAccount && (
            <LoginTypeButton
              large={true}
              icon={IconNames.GLOBE_NETWORK}
              onClick={loginWithDm}
              loading={!!isSendingLoginRequest}
            >
              {`DM ${loginTypes.fediverseAccount}`}
            </LoginTypeButton>
          )} */}
        </LoginTypeContainer>
      </>
    );
  };

  private renderPostLogin = () => {
    const { selectedLoginType, loginTypes } = this.state;
    let message;
    if (selectedLoginType === "email") {
      message = `Check ${loginTypes!.email} for a login link`;
    } else {
      message = `Check ${loginTypes!.fediverseAccount}'s DMs for a login link.`;
    }
    return (
      <PostLoginContainer>
        <StyledIcon icon={IconNames.ENVELOPE} iconSize={80} />
        <p className={Classes.TEXT_LARGE}>{message}</p>
      </PostLoginContainer>
    );
  };

  private updateDomainInState = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ domain: event.target.value });
  };

  private getLoginTypes = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({ isGettingLoginTypes: true });
    let { domain } = this.state;
    if (domain.startsWith("https://")) {
      domain = domain.slice(8);
    }
    getFromApi(`admin/login/${domain}`)
      .then(response => {
        this.setState({ loginTypes: response, isGettingLoginTypes: false });
      })
      .catch(() => {
        this.setState({ error: true });
      });
  };

  private login = (type: "email" | "fediverseAccount") => {
    this.setState({ isSendingLoginRequest: true, selectedLoginType: type });
    postToApi("admin/login", { domain: this.state.loginTypes!.domain, type })
      .then(response => {
        if ("error" in response) {
          this.setState({ isSendingLoginRequest: false, error: true });
        } else {
          this.setState({ isSendingLoginRequest: false });
        }
      })
      .catch(() => this.setState({ isSendingLoginRequest: false, error: true }));
  };
}

export default LoginScreen;
