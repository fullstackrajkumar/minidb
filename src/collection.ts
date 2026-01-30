import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { QueryBuilder } from "./query";
import { generateId } from "./utils";

export class Collection<T = any> {
  private collectionPath: string;
  private dataFile: string;
  private schemaFile: string;

  constructor(private name: string, private basePath: string) {
    this.collectionPath = path.join(basePath, name);
    this.dataFile = path.join(this.collectionPath, "data.json");
    this.schemaFile = path.join(this.collectionPath, "schema.json");
  }

  // ---------- Internal Helpers ----------

  private async ensureCollection() {
    if (!existsSync(this.collectionPath)) {
      throw new Error(`Collection "${this.name}" does not exist`);
    }

    if (!existsSync(this.dataFile)) {
      await fs.writeFile(this.dataFile, JSON.stringify([], null, 2));
    }
  }

  private async readData(): Promise<T[]> {
    await this.ensureCollection();
    const raw = await fs.readFile(this.dataFile, "utf-8");
    return JSON.parse(raw);
  }

  private async writeData(data: T[]): Promise<void> {
    await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
  }

  // ---------- Public APIs ----------

  find(query: Partial<T> = {}) {
    return new QueryBuilder<T>(this, query);
  }

  async insertOne(doc: T): Promise<T & { _id: string; createdAt: string }> {
    const data = await this.readData();
  
    const newDoc = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      ...doc
    } as T & { _id: string; createdAt: string };
  
    data.push(newDoc);
    await this.writeData(data);
  
    return newDoc;
  }

  async insertMany(
    docs: T[]
  ): Promise<(T & { _id: string; createdAt: string })[]> {
    const data = await this.readData();
  
    const newDocs = docs.map(doc => ({
      _id: generateId(),
      createdAt: new Date().toISOString(),
      ...doc
    })) as (T & { _id: string; createdAt: string })[];
  
    data.push(...newDocs);
    await this.writeData(data);
  
    return newDocs;
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const data = await this.readData();
    return (
      data.find(doc =>
        Object.entries(query).every(([k, v]) => (doc as any)[k] === v)
      ) || null
    );
  }

  async create(doc: T) {
    return this.insertOne(doc);
  }

  async updateOne(
    filter: Partial<T>,
    update: Partial<T>
  ): Promise<{ matched: number; modified: number }> {
    const data = await this.readData();

    let matched = 0;
    let modified = 0;

    for (let i = 0; i < data.length; i++) {
      const doc = data[i];

      if (
        Object.entries(filter).every(([k, v]) => (doc as any)[k] === v)
      ) {
        matched++;
        data[i] = { ...doc, ...update } as T;
        modified++;
        break;
      }
    }

    if (modified) {
      await this.writeData(data);
    }

    return { matched, modified };
  }

  async updateMany(
    filter: Partial<T>,
    update: Partial<T>
  ): Promise<{ matched: number; modified: number }> {
    const data = await this.readData();
  
    let matched = 0;
    let modified = 0;
  
    for (let i = 0; i < data.length; i++) {
      const doc = data[i];
  
      if (
        Object.entries(filter).every(([k, v]) => (doc as any)[k] === v)
      ) {
        matched++;
        data[i] = { ...doc, ...update } as T;
        modified++;
      }
    }
  
    if (modified > 0) {
      await this.writeData(data);
    }
  
    return { matched, modified };
  }

  async deleteOne(filter: Partial<T>): Promise<{ deleted: number }> {
    const data = await this.readData();

    const index = data.findIndex(doc =>
      Object.entries(filter).every(([k, v]) => (doc as any)[k] === v)
    );

    if (index === -1) return { deleted: 0 };

    data.splice(index, 1);
    await this.writeData(data);

    return { deleted: 1 };
  }

  async deleteMany(
    filter: Partial<T>
  ): Promise<{ deleted: number }> {
    const data = await this.readData();
  
    const originalLength = data.length;
  
    const filtered = data.filter(
      doc =>
        !Object.entries(filter).every(
          ([k, v]) => (doc as any)[k] === v
        )
    );
  
    const deleted = originalLength - filtered.length;
  
    if (deleted > 0) {
      await this.writeData(filtered);
    }
  
    return { deleted };
  }

  // Used internally by QueryBuilder
  async _getAll(): Promise<T[]> {
    return this.readData();
  }
}
