type SearchFilterRelation = "eq" | "gt" | "gte" | "lt" | "lte";
export interface SearchFilter {
  // The ES field to filter on
  field: string;
  relation: SearchFilterRelation;
  // The value we want to filter to
  value: string;
  // Human-meaningful text that we're showing in the UI
  displayValue: string;
}

// Maps to translate this to user-friendly text
type SearchFilterField = "type" | "user_count";
const searchFilterFieldTranslations = {
  type: "Instance type",
  user_count: "User count",
};
const searchFilterRelationTranslations = {
  eq: "=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

export const getSearchFilterDisplayValue = (field: SearchFilterField, relation: SearchFilterRelation, value: string) =>
  `${searchFilterFieldTranslations[field]} ${searchFilterRelationTranslations[relation]} ${value}`;
