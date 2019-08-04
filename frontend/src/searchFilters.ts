type ISearchFilterRelation = "eq" | "gt" | "gte" | "lt" | "lte";
export interface ISearchFilter {
  // The ES field to filter on
  field: string;
  relation: ISearchFilterRelation;
  // The value we want to filter to
  value: string;
  // Human-meaningful text that we're showing in the UI
  displayValue: string;
}

// Maps to translate this to user-friendly text
const searchFilterFieldTranslations = {
  type: "Instance type",
  user_count: "User count"
};
const searchFilterRelationTranslations = {
  eq: "=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<="
};

export const getSearchFilterDisplayValue = (field: string, relation: ISearchFilterRelation, value: string) =>
  `${searchFilterFieldTranslations[field]} ${searchFilterRelationTranslations[relation]} ${value}`;
