import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { AppState } from "../../redux/types";
import { setAuthToken } from "../../util";
import { Page } from "../atoms";

interface VerifyLoginScreenProps {
  search: string;
}
const VerifyLoginScreen: React.FC<VerifyLoginScreenProps> = ({ search }) => {
  const [didSaveToken, setDidSaveToken] = useState(false);
  const token = new URLSearchParams(search).get("token");

  useEffect(() => {
    // Save the auth token
    if (token) {
      setAuthToken(token);
      setDidSaveToken(true);
    }
  }, [token]);

  if (!token) {
    return <Redirect to="/admin/login" />;
  }
  if (!didSaveToken) {
    return <Page />;
  }
  return <Redirect to="/admin" />;
};

const mapStateToProps = (state: AppState) => ({
  search: state.router.location.search,
});
export default connect(mapStateToProps)(VerifyLoginScreen);
