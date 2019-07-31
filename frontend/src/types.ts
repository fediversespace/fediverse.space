interface IColorSchemeBase {
  // The name of the coloring, e.g. "Instance type"
  name: string;
  // The name of the key in a cytoscape node's `data` field to color by.
  // For example, use cytoscapeDataKey: "type" to color according to type.
  cytoscapeDataKey: string;
  description?: string;
  type: "qualitative" | "quantitative";
}
interface IQualitativeColorScheme extends IColorSchemeBase {
  // The values the color scheme is used for. E.g. ["mastodon", "pleroma", "misskey"].
  values: string[];
  type: "qualitative";
}
interface IQuantitativeColorScheme extends IColorSchemeBase {
  type: "quantitative";
  exponential: boolean;
}

export type IColorScheme = IQualitativeColorScheme | IQuantitativeColorScheme;

export const typeColorScheme: IQualitativeColorScheme = {
  cytoscapeDataKey: "type",
  name: "Instance type",
  type: "qualitative",
  // We could also extract the values from the server response, but this would slow things down...
  values: ["mastodon", "gab", "pleroma"]
};
export const activityColorScheme: IQuantitativeColorScheme = {
  cytoscapeDataKey: "statusesPerDay",
  description: "The average number of statuses posted per day.",
  exponential: true,
  name: "Activity",
  type: "quantitative"
};

export const colorSchemes: IColorScheme[] = [typeColorScheme, activityColorScheme];
