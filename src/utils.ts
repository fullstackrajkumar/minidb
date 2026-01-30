import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

/**
 * Ensure directory exists (mkdir -p)
 */
export function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Ensure JSON file exists, else create with default value
 */
export async function ensureJSONFile(
  filePath: string,
  defaultValue: any = []
) {
  if (!existsSync(filePath)) {
    ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

/**
 * Read JSON file safely
 */
export async function readJSON<T = any>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

/**
 * Write JSON file safely
 */
export async function writeJSON(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Generate simple unique id (can be replaced later with UUID)
 */
export function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

export function serializeSchema(schema: Record<string, any>) {
  const result: Record<string, string> = {};

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
