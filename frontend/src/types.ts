import { INSTANCE_TYPES } from "./constants";

interface ColorSchemeBase {
  // The name of the coloring, e.g. "Instance type"
  name: string;
  // The name of the key in a cytoscape node's `data` field to color by.
  // For example, use cytoscapeDataKey: "type" to color according to type.
  cytoscapeDataKey: string;
  description?: string;
  type: "qualitative" | "quantitative";
}
interface QualitativeColorScheme extends ColorSchemeBase {
  // The values the color scheme is used for. E.g. ["mastodon", "pleroma", "misskey"].
  values: string[];
  type: "qualitative";
}
interface QuantitativeColorScheme extends ColorSchemeBase {
  type: "quantitative";
  exponential: boolean;
}

export type ColorScheme = QualitativeColorScheme | QuantitativeColorScheme;

export const typeColorScheme: QualitativeColorScheme = {
  cytoscapeDataKey: "type",
  name: "Instance type",
  type: "qualitative",
  values: INSTANCE_TYPES,
};
export const activityColorScheme: QuantitativeColorScheme = {
  cytoscapeDataKey: "statusesPerDay",
  description: "The average number of statuses posted per day. This is an exponential scale.",
  exponential: true,
  name: "Activity",
  type: "quantitative",
};

export const colorSchemes: ColorScheme[] = [typeColorScheme, activityColorScheme];
