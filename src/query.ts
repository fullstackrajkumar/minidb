import { Collection } from "./collection";

type SortOrder = 1 | -1;

export class QueryBuilder<T = any> {
  private _skip = 0;
  private _limit = Infinity;
  private _sort: Record<string, SortOrder> | null = null;

  constructor(
    private collection: Collection<T>,
    private query: any
  ) {}

  skip(n: number) {
    this._skip = n;
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  sort(sortObj: Record<string, SortOrder>) {
    this._sort = sortObj;
    return this;
  }

  async exec(): Promise<T[]> {
    let data = await this.collection._getAll();

    // Apply filters
    data = data.filter(doc => this.matchQuery(doc, this.query));

    // Apply sorting
    if (this._sort) {
      const entries = Object.entries(this._sort);
      const first = entries[0];
      if (first) {
        const [key, order] = first;
        data.sort((a: any, b: any) => {
          if (a[key] > b[key]) return order;
          if (a[key] < b[key]) return -order;
          return 0;
        });
      }
    }

    // Apply skip + limit
    return data.slice(this._skip, this._skip + this._limit);
  }

  // Makes await db.users.find() work directly
  then(resolve: (value: T[]) => any, reject?: (reason: any) => any) {
    return this.exec().then(resolve, reject);
  }

  // ---------------- INTERNAL ----------------

  private matchQuery(doc: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true;

    return Object.entries(query).every(([key, condition]) => {
      const value = doc[key];

      if (typeof condition === "object" && condition !== null) {
        return this.applyOperators(value, condition);
      }

      return value === condition;
    });
  }

  private applyOperators(value: any, condition: any): boolean {
    for (const op in condition) {
      const target = condition[op];

      switch (op) {
        case "$gt":
          if (!(value > target)) return false;
          break;

        case "$gte":
          if (!(value >= target)) return false;
          break;

        case "$lt":
          if (!(value < target)) return false;
          break;

        case "$lte":
          if (!(value <= target)) return false;
          break;

        case "$ne":
          if (!(value !== target)) return false;
          break;

        case "$in":
          if (!Array.isArray(target) || !target.includes(value)) return false;
          break;

        case "$regex":
          if (!(new RegExp(target, condition.$options || "").test(value)))
            return false;
          break;

        default:
          throw new Error(`Unsupported operator: ${op}`);
      }
    }

    return true;
  }
}
