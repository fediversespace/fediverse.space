import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { IAppState } from "../../redux/types";
import { setAuthToken } from "../../util";
import { Page } from "../atoms";

interface IVerifyLoginScreenProps {
  search: string;
}
const VerifyLoginScreen: React.FC<IVerifyLoginScreenProps> = ({ search }) => {
  const [didSaveToken, setDidSaveToken] = useState(false);
  const token = new URLSearchParams(search).get("token");

  useEffect(() => {
    // Save the auth token
    if (!!token) {
      setAuthToken(token);
      setDidSaveToken(true);
    }
  }, [token]);

  if (!token) {
    return <Redirect to="/admin/login" />;
  } else if (!didSaveToken) {
    return <Page />;
  }
  return <Redirect to="/admin" />;
};

const mapStateToProps = (state: IAppState) => {
  return {
    search: state.router.location.search
  };
};
export default connect(mapStateToProps)(VerifyLoginScreen);
