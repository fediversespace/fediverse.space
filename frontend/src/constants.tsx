/* Screen widths less than this will be treated as mobile */
export const DESKTOP_WIDTH_THRESHOLD = 1000;

export const DEFAULT_NODE_COLOR = "#CED9E0";
export const SELECTED_NODE_COLOR = "#48AFF0";
export const SEARCH_RESULT_COLOR = "#AD99FF";
export const HOVERED_NODE_COLOR = SEARCH_RESULT_COLOR;

// From https://blueprintjs.com/docs/#core/colors.qualitative-color-schemes, but brightened
export const QUALITATIVE_COLOR_SCHEME = [
  "#669EFF",
  "#FFC940",
  "#FF6E4A",
  "#62D96B",
  "#C274C2",
  "#2EE6D6",
  "#FF66A1",
  "#D1F26D",
  "#C99765",
  "#AD99FF",
  "#0E5A8A",
  "#0A6640",
  "#AAB42F",
  "#A66321",
  "#A82A2A",
];

// From https://blueprintjs.com/docs/#core/colors.sequential-color-schemes
export const QUANTITATIVE_COLOR_SCHEME = [
  "#FFB7A5",
  "#F5A793",
  "#EB9882",
  "#E18970",
  "#D77A60",
  "#CC6A4F",
  "#C15B3F",
  "#B64C2F",
  "#AA3C1F",
  "#9E2B0E",
];

export const INSTANCE_DOMAIN_PATH = "/instance/:domain";
export interface InstanceDomainPath {
  domain: string;
}

export const INSTANCE_TYPES = [
  "mastodon",
  "pleroma",
  "misskey",
  "gab",
  "pixelfed",
  "gnusocial",
  "writefreely",
  "peertube",
  "friendica",
  "hubzilla",
  "plume",
  "wordpress",
  "smithereen",
];
