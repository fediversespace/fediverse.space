import { createMatchSelector } from "connected-react-router";
import fetch from "cross-fetch";
import { DESKTOP_WIDTH_THRESHOLD, IInstanceDomainPath, INSTANCE_DOMAIN_PATH } from "./constants";
import { IAppState } from "./redux/types";

let API_ROOT = "http://localhost:4000/api/";
if (["true", true, 1, "1"].indexOf(process.env.REACT_APP_STAGING || "") > -1) {
  API_ROOT = "https://phoenix.api-develop.fediverse.space/api/";
} else if (process.env.NODE_ENV === "production") {
  API_ROOT = "https://phoenix.api.fediverse.space/api/";
}

export const getFromApi = (path: string, token?: string): Promise<any> => {
  const domain = API_ROOT.endsWith("/") ? API_ROOT : API_ROOT + "/";
  const headers = token ? { token } : undefined;
  return fetch(encodeURI(domain + path), {
    headers
  }).then(response => response.json());
};

export const postToApi = (path: string, body: any, token?: string): Promise<any> => {
  const domain = API_ROOT.endsWith("/") ? API_ROOT : API_ROOT + "/";
  const defaultHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const headers = token ? { ...defaultHeaders, token } : defaultHeaders;
  return fetch(encodeURI(domain + path), {
    body: JSON.stringify(body),
    headers,
    method: "POST"
  }).then(response => {
    return response.json();
  });
};

export const domainMatchSelector = createMatchSelector<IAppState, IInstanceDomainPath>(INSTANCE_DOMAIN_PATH);

export const isSmallScreen = window.innerWidth < DESKTOP_WIDTH_THRESHOLD;

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export const setAuthToken = (token: string) => {
  sessionStorage.setItem("adminToken", token);
};

export const unsetAuthToken = () => {
  sessionStorage.removeItem("adminToken");
};

export const getAuthToken = () => {
  return sessionStorage.getItem("adminToken");
  // TODO: check if it's expired, and if so a) delete it and b) return null
};
