import path from "path";
import fs from "fs";
import { Collection } from "./collection";
import { SchemaDefinition } from "./types";
import { serializeSchema } from "./utils";

export interface DBInstance {
  createCollection(name: string, schema: SchemaDefinition): Promise<void>;
  [key: string]: any;
}

export function connect(basePath?: string): DBInstance {
  const finalPath = basePath && basePath.trim() !== "" ? basePath : ".data";
  const resolvedPath = path.resolve(process.cwd(), finalPath);

  // Ensure base directory exists
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  const db = new Proxy(
    {
      async createCollection(name: string, schema: SchemaDefinition) {
        const collectionPath = path.join(resolvedPath, name);

        if (!fs.existsSync(collectionPath)) {
          fs.mkdirSync(collectionPath, { recursive: true });
        }

        const schemaFile = path.join(collectionPath, "schema.json");
        const parsedSchema = serializeSchema(schema);

        if (!fs.existsSync(schemaFile)) {
          fs.writeFileSync(schemaFile, JSON.stringify(parsedSchema, null, 2));
        }
      }
    },
    {
      get(target, prop: string) {
        if (prop in target) return (target as any)[prop];

        return new Collection(prop, resolvedPath);
      }
    }
  );

  return db as DBInstance;
}
