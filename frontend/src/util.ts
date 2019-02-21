import fetch from "cross-fetch";

const API_ROOT =
  process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1/" : "https://api.fediverse.space/api/v1/";

export const getFromApi = (path: string): Promise<any> => {
  const domain = API_ROOT.endsWith("/") ? API_ROOT : API_ROOT + "/";
  path = path.endsWith("/") ? path : path + "/";
  path += "?format=json";
  return fetch(domain + path).then(response => response.json());
};
