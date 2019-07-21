import { createMatchSelector } from "connected-react-router";
import fetch from "cross-fetch";
import { IInstanceDomainPath, INSTANCE_DOMAIN_PATH } from "./constants";
import { IAppState } from "./redux/types";

let API_ROOT = "http://localhost:4000/api/";
if (["true", true, 1, "1"].indexOf(process.env.REACT_APP_STAGING || "") > -1) {
  API_ROOT = "https://phoenix.api-develop.fediverse.space/api/";
} else if (process.env.NODE_ENV === "production") {
  API_ROOT = "https://phoenix.api.fediverse.space/api/";
}

export const getFromApi = (path: string): Promise<any> => {
  const domain = API_ROOT.endsWith("/") ? API_ROOT : API_ROOT + "/";
  path = path.endsWith("/") ? path : path + "/";
  return fetch(domain + path).then(response => response.json());
};

export const domainMatchSelector = createMatchSelector<IAppState, IInstanceDomainPath>(INSTANCE_DOMAIN_PATH);
