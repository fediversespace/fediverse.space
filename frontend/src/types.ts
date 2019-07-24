export interface IColorSchemeType {
  // The name of the coloring, e.g. "Instance type"
  name: string;
  // The name of the key in a cytoscape node's `data` field to color by.
  // For example, use cytoscapeDataKey: "type" to color according to type.
  cytoscapeDataKey: string;
  // The values the color scheme is used for. E.g. ["mastodon", "pleroma", "misskey"].
  values: string[];
}

export const typeColorScheme: IColorSchemeType = {
  cytoscapeDataKey: "type",
  name: "Instance type",
  // We could also extract the values from the server response, but this would slow things down...
  values: ["mastodon", "gab", "pleroma"]
};

export const colorSchemes: IColorSchemeType[] = [typeColorScheme];
