import fetch from "cross-fetch";

const API_ROOT =
  process.env.NODE_ENV === "development" ? "http://localhost:4000/api/" : "https://backend.fediverse.space/api/";

export const getFromApi = (path: string): Promise<any> => {
  const domain = API_ROOT.endsWith("/") ? API_ROOT : API_ROOT + "/";
  path = path.endsWith("/") ? path : path + "/";
  return fetch(domain + path).then(response => response.json());
};
