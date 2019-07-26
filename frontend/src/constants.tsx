/* Screen widths less than this will be treated as mobile */
export const DESKTOP_WIDTH_THRESHOLD = 1000;

export const DEFAULT_NODE_COLOR = "#CED9E0";
export const SELECTED_NODE_COLOR = "#48AFF0";
export const SEARCH_RESULT_COLOR = "#AD99FF";
export const HOVERED_NODE_COLOR = SEARCH_RESULT_COLOR;

// From https://blueprintjs.com/docs/#core/colors.qualitative-color-schemes, but brightened
export const QUALITATIVE_COLOR_SCHEME = [
  "#669EFF",
  "#62D96B",
  "#FFC940",
  "#FF6E4A",
  "#C274C2",
  "#2EE6D6",
  "#FF66A1",
  "#D1F26D",
  "#C99765",
  "#AD99FF"
];

export const INSTANCE_DOMAIN_PATH = "/instance/:domain";
export interface IInstanceDomainPath {
  domain: string;
}
