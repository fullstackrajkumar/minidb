# @fullstackrajkumar/minidb

[![npm version](https://img.shields.io/npm/v/@fullstackrajkumar/minidb.svg)](https://www.npmjs.com/package/@fullstackrajkumar/minidb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A MongoDB-like, file-based embedded database for Node.js.** Store JSON documents on disk with a familiar API—no server, no external dependencies. Written in TypeScript with full type definitions.

---

## Features

- **MongoDB-style API** — `find`, `findOne`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`
- **Query operators** — `$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$in`, `$regex`
- **Fluent query builder** — chain `.limit()`, `.skip()`, `.sort()` then `.exec()` or `await`
- **Schema support** — optional `createCollection(name, schema)` with JSON schema files
- **File-based** — each collection is a directory with `data.json` and optional `schema.json`
- **TypeScript** — first-class types and generics
- **Zero runtime deps** — only Node.js built-ins

---

## Installation

```bash
npm install @fullstackrajkumar/minidb
```

**Requirements:** Node.js 18+ (uses `fs/promises` and modern ES).

---

## Quick Start

```ts
import { connect } from "@fullstackrajkumar/minidb";

const db = connect("./data"); // or connect() → uses "./.data"

// Create a collection (optional; creates dir + schema.json)
await db.createCollection("users", {
  name: String,
  email: String,
  age: Number,
});

// Access collection by property name
const users = db.users; // Collection<YourType>

// Insert
await users.insertOne({ name: "Alice", email: "alice@example.com", age: 30 });
await users.insertMany([
  { name: "Bob", email: "bob@example.com", age: 25 },
  { name: "Carol", email: "carol@example.com", age: 28 },
]);

// Find one
const user = await users.findOne({ email: "alice@example.com" });

// Find with query builder (supports operators)
const adults = await users.find({ age: { $gte: 18 } }).limit(10).exec();

// Or use thenable: await users.find({ age: { $gte: 18 } })
const first = await users.find({}).sort({ age: -1 }).limit(1).exec();
```

---

## API Reference

### `connect(basePath?: string)`

Creates a database instance backed by a directory on disk.

- **`basePath`** — Directory path (relative to `process.cwd()` or absolute). Default: `".data"`.
- **Returns:** `DBInstance` (proxy: `db.<collectionName>` returns a `Collection`).

```ts
const db = connect("./my-db");
const db2 = connect(); // uses ./.data
```

---

### `db.createCollection(name, schema)`

Creates a collection directory and optional `schema.json`. Call this before using a new collection, or use the collection directly (directory and `data.json` are created on first write).

- **`name`** — Collection name (used as directory name).
- **`schema`** — Optional: `{ fieldName: String | Number | Boolean | Date }`.

```ts
await db.createCollection("posts", {
  title: String,
  body: String,
  published: Boolean,
  createdAt: Date,
});
```

---

### Collection methods

Access a collection via `db.<collectionName>` (e.g. `db.users`). All methods are async except `find()` (returns a `QueryBuilder`).

| Method | Description |
|--------|-------------|
| `insertOne(doc)` | Insert one document. Adds `_id` and `createdAt`. Returns the inserted doc. |
| `insertMany(docs)` | Insert multiple documents. Adds `_id` and `createdAt` to each. |
| `findOne(query)` | Return first document matching `query`, or `null`. |
| `find(query?)` | Return a `QueryBuilder`; use `.exec()` or `await` to get results. |
| `updateOne(filter, update)` | Update first document matching `filter`. Returns `{ matched, modified }`. |
| `updateMany(filter, update)` | Update all documents matching `filter`. Returns `{ matched, modified }`. |
| `deleteOne(filter)` | Delete first document matching `filter`. Returns `{ deleted }`. |
| `deleteMany(filter)` | Delete all documents matching `filter`. Returns `{ deleted }`. |
| `create(doc)` | Alias for `insertOne(doc)`. |

**Query shape:** `query` / `filter` is a plain object. Fields can be exact values or operator objects (see Query operators).

---

### QueryBuilder (from `find()`)

Chain methods, then call `.exec()` or use as a thenable (`await collection.find(...)`).

| Method | Description |
|--------|-------------|
| `.limit(n)` | Max number of documents to return. |
| `.skip(n)` | Number of documents to skip. |
| `.sort(obj)` | Sort by field(s). `{ field: 1 }` ascending, `{ field: -1 }` descending. |
| `.exec()` | Returns `Promise<T[]>` with the result. |
| `await builder` | Same as `await builder.exec()`. |

```ts
const list = await users
  .find({ status: "active" })
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(20)
  .exec();
```

---

### Query operators

Use inside a field value in `find`, `findOne`, or query builder filters.

| Operator | Meaning | Example |
|----------|---------|---------|
| `$eq` | Equals | `{ age: { $eq: 25 } }` |
| `$ne` | Not equals | `{ status: { $ne: "archived" } }` |
| `$gt` | Greater than | `{ age: { $gt: 18 } }` |
| `$gte` | Greater than or equal | `{ score: { $gte: 60 } }` |
| `$lt` | Less than | `{ age: { $lt: 65 } }` |
| `$lte` | Less than or equal | `{ count: { $lte: 10 } }` |
| `$in` | Value in array | `{ role: { $in: ["admin", "editor"] } }` |
| `$regex` | Regex match | `{ name: { $regex: "^A" } }` or `{ $regex: "^A", $options: "i" }` |

```ts
await users.find({ age: { $gte: 21 }, role: { $in: ["user", "admin"] } }).exec();
await users.findOne({ email: { $regex: "@example\\.com$" } });
```

---

## TypeScript

Use generics for typed documents:

```ts
import { connect, Collection } from "@fullstackrajkumar/minidb";

interface User {
  name: string;
  email: string;
  age: number;
}

const db = connect("./data");
const users = db.users as Collection<User>; // or type the connect result

await users.insertOne({ name: "Alice", email: "a@b.com", age: 30 });
const one: User | null = await users.findOne({ email: "a@b.com" });
const list: User[] = await users.find({ age: { $gte: 18 } }).exec();
```

Exported types: `DBInstance`, `SchemaDefinition`, `FilterQuery`, `SortQuery`, `QueryOperators`, `PrimitiveType`.

---

## Utilities

Available as named exports for use outside collections:

| Function | Description |
|----------|-------------|
| `ensureDir(dirPath)` | Create directory recursively if it doesn’t exist. |
| `ensureJSONFile(filePath, defaultValue?)` | Create a JSON file with default value if missing. |
| `readJSON<T>(filePath)` | Read and parse a JSON file. |
| `writeJSON(filePath, data)` | Write data as JSON to file. |
| `generateId()` | Generate a short unique id (used for `_id`). |

---

## Data storage

- **Base path:** Whatever you pass to `connect(basePath)` (e.g. `./data`).
- **Per collection:** `basePath/<collectionName>/`
  - `data.json` — array of documents (created on first write).
  - `schema.json` — optional; written by `createCollection(name, schema)`.

Documents inserted via `insertOne` / `insertMany` get `_id` and `createdAt` added automatically.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` (CJS + `.d.ts`). |
| `npm run dev` | Run entry with `ts-node`. |
| `npm run lint` | Run ESLint. |

---

## License

MIT © [Rajkumar Yadav](https://github.com/fullstackrajkumar)

---

## Links

- [npm](https://www.npmjs.com/package/@fullstackrajkumar/minidb)
- [Repository](https://github.com/your-username/minidb)
- [Issues](https://github.com/your-username/minidb/issues)
