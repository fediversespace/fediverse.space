/* Screen widths less than this will be treated as mobile */
export const DESKTOP_WIDTH_THRESHOLD = 1000;

export const DEFAULT_NODE_COLOR = "#CED9E0";
export const SELECTED_NODE_COLOR = "#48AFF0";

// From https://blueprintjs.com/docs/#core/colors.qualitative-color-schemes
export const QUALITATIVE_COLOR_SCHEME = [
  "#2965CC",
  "#29A634",
  "#D99E0B",
  "#D13913",
  "#8F398F",
  "#00B3A4",
  "#DB2C6F",
  "#9BBF30",
  "#96622D",
  "#7157D9"
];

export const INSTANCE_DOMAIN_PATH = "/instance/:domain";
export interface IInstanceDomainPath {
  domain: string;
}
