"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Collection: () => Collection,
  QueryBuilder: () => QueryBuilder,
  connect: () => connect,
  ensureDir: () => ensureDir,
  ensureJSONFile: () => ensureJSONFile,
  generateId: () => generateId,
  readJSON: () => readJSON,
  writeJSON: () => writeJSON
});
module.exports = __toCommonJS(index_exports);

// src/engine.ts
var import_path3 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));

// src/collection.ts
var import_path2 = __toESM(require("path"));
var import_promises2 = __toESM(require("fs/promises"));
var import_fs2 = require("fs");

// src/query.ts
var QueryBuilder = class {
  constructor(collection, query) {
    this.collection = collection;
    this.query = query;
    this._skip = 0;
    this._limit = Infinity;
    this._sort = null;
  }
  skip(n) {
    this._skip = n;
    return this;
  }
  limit(n) {
    this._limit = n;
    return this;
  }
  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }
  async exec() {
    let data = await this.collection._getAll();
    data = data.filter((doc) => this.matchQuery(doc, this.query));
    if (this._sort) {
      const entries = Object.entries(this._sort);
      const first = entries[0];
      if (first) {
        const [key, order] = first;
        data.sort((a, b) => {
          if (a[key] > b[key]) return order;
          if (a[key] < b[key]) return -order;
          return 0;
        });
      }
    }
    return data.slice(this._skip, this._skip + this._limit);
  }
  // Makes await db.users.find() work directly
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
  // ---------------- INTERNAL ----------------
  matchQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) return true;
    return Object.entries(query).every(([key, condition]) => {
      const value = doc[key];
      if (typeof condition === "object" && condition !== null) {
        return this.applyOperators(value, condition);
      }
      return value === condition;
    });
  }
  applyOperators(value, condition) {
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
          if (!new RegExp(target, condition.$options || "").test(value))
            return false;
          break;
        default:
          throw new Error(`Unsupported operator: ${op}`);
      }
    }
    return true;
  }
};

// src/utils.ts
var import_promises = __toESM(require("fs/promises"));
var import_fs = require("fs");
var import_path = __toESM(require("path"));
function ensureDir(dirPath) {
  if (!(0, import_fs.existsSync)(dirPath)) {
    (0, import_fs.mkdirSync)(dirPath, { recursive: true });
  }
}
async function ensureJSONFile(filePath, defaultValue = []) {
  if (!(0, import_fs.existsSync)(filePath)) {
    ensureDir(import_path.default.dirname(filePath));
    await import_promises.default.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
}
async function readJSON(filePath) {
  const raw = await import_promises.default.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}
async function writeJSON(filePath, data) {
  await import_promises.default.writeFile(filePath, JSON.stringify(data, null, 2));
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}
function serializeSchema(schema) {
  const result = {};
  for (const key in schema) {
    const val = schema[key];
    switch (val) {
      case String:
        result[key] = "string";
        break;
      case Number:
        result[key] = "number";
        break;
      case Boolean:
        result[key] = "boolean";
        break;
      case Date:
        result[key] = "date";
        break;
      default:
        throw new Error(`Unsupported schema type for field "${key}"`);
    }
  }
  return result;
}

// src/collection.ts
var Collection = class {
  constructor(name, basePath) {
    this.name = name;
    this.basePath = basePath;
    this.collectionPath = import_path2.default.join(basePath, name);
    this.dataFile = import_path2.default.join(this.collectionPath, "data.json");
    this.schemaFile = import_path2.default.join(this.collectionPath, "schema.json");
  }
  // ---------- Internal Helpers ----------
  async ensureCollection() {
    if (!(0, import_fs2.existsSync)(this.collectionPath)) {
      throw new Error(`Collection "${this.name}" does not exist`);
    }
    if (!(0, import_fs2.existsSync)(this.dataFile)) {
      await import_promises2.default.writeFile(this.dataFile, JSON.stringify([], null, 2));
    }
  }
  async readData() {
    await this.ensureCollection();
    const raw = await import_promises2.default.readFile(this.dataFile, "utf-8");
    return JSON.parse(raw);
  }
  async writeData(data) {
    await import_promises2.default.writeFile(this.dataFile, JSON.stringify(data, null, 2));
  }
  // ---------- Public APIs ----------
  find(query = {}) {
    return new QueryBuilder(this, query);
  }
  async insertOne(doc) {
    const data = await this.readData();
    const newDoc = {
      _id: generateId(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...doc
    };
    data.push(newDoc);
    await this.writeData(data);
    return newDoc;
  }
  async insertMany(docs) {
    const data = await this.readData();
    const newDocs = docs.map((doc) => ({
      _id: generateId(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...doc
    }));
    data.push(...newDocs);
    await this.writeData(data);
    return newDocs;
  }
  async findOne(query) {
    const data = await this.readData();
    return data.find(
      (doc) => Object.entries(query).every(([k, v]) => doc[k] === v)
    ) || null;
  }
  async create(doc) {
    return this.insertOne(doc);
  }
  async updateOne(filter, update) {
    const data = await this.readData();
    let matched = 0;
    let modified = 0;
    for (let i = 0; i < data.length; i++) {
      const doc = data[i];
      if (Object.entries(filter).every(([k, v]) => doc[k] === v)) {
        matched++;
        data[i] = { ...doc, ...update };
        modified++;
        break;
      }
    }
    if (modified) {
      await this.writeData(data);
    }
    return { matched, modified };
  }
  async updateMany(filter, update) {
    const data = await this.readData();
    let matched = 0;
    let modified = 0;
    for (let i = 0; i < data.length; i++) {
      const doc = data[i];
      if (Object.entries(filter).every(([k, v]) => doc[k] === v)) {
        matched++;
        data[i] = { ...doc, ...update };
        modified++;
      }
    }
    if (modified > 0) {
      await this.writeData(data);
    }
    return { matched, modified };
  }
  async deleteOne(filter) {
    const data = await this.readData();
    const index = data.findIndex(
      (doc) => Object.entries(filter).every(([k, v]) => doc[k] === v)
    );
    if (index === -1) return { deleted: 0 };
    data.splice(index, 1);
    await this.writeData(data);
    return { deleted: 1 };
  }
  async deleteMany(filter) {
    const data = await this.readData();
    const originalLength = data.length;
    const filtered = data.filter(
      (doc) => !Object.entries(filter).every(
        ([k, v]) => doc[k] === v
      )
    );
    const deleted = originalLength - filtered.length;
    if (deleted > 0) {
      await this.writeData(filtered);
    }
    return { deleted };
  }
  // Used internally by QueryBuilder
  async _getAll() {
    return this.readData();
  }
};

// src/engine.ts
function connect(basePath) {
  const finalPath = basePath && basePath.trim() !== "" ? basePath : ".data";
  const resolvedPath = import_path3.default.resolve(process.cwd(), finalPath);
  if (!import_fs3.default.existsSync(resolvedPath)) {
    import_fs3.default.mkdirSync(resolvedPath, { recursive: true });
  }
  const db = new Proxy(
    {
      async createCollection(name, schema) {
        const collectionPath = import_path3.default.join(resolvedPath, name);
        if (!import_fs3.default.existsSync(collectionPath)) {
          import_fs3.default.mkdirSync(collectionPath, { recursive: true });
        }
        const schemaFile = import_path3.default.join(collectionPath, "schema.json");
        const parsedSchema = serializeSchema(schema);
        if (!import_fs3.default.existsSync(schemaFile)) {
          import_fs3.default.writeFileSync(schemaFile, JSON.stringify(parsedSchema, null, 2));
        }
      }
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return new Collection(prop, resolvedPath);
      }
    }
  );
  return db;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Collection,
  QueryBuilder,
  connect,
  ensureDir,
  ensureJSONFile,
  generateId,
  readJSON,
  writeJSON
});
