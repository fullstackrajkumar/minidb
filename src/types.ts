// Primitive schema types
export type PrimitiveType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor;

// Schema definition structure
export type SchemaDefinition<T = any> = {
  [K in keyof T]: PrimitiveType;
};

// Supported query operators
export type QueryOperators<T> = {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $regex?: string;
  $options?: string;
};

// Query filter type
export type FilterQuery<T> = {
  [K in keyof T]?: T[K] | QueryOperators<T[K]>;
};

// Sort query
export type SortQuery<T> = {
  [K in keyof T]?: 1 | -1;
};
