type PrimitiveType = StringConstructor | NumberConstructor | BooleanConstructor | DateConstructor;
type SchemaDefinition<T = any> = {
    [K in keyof T]: PrimitiveType;
};
type QueryOperators<T> = {
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
type FilterQuery<T> = {
    [K in keyof T]?: T[K] | QueryOperators<T[K]>;
};
type SortQuery<T> = {
    [K in keyof T]?: 1 | -1;
};

interface DBInstance {
    createCollection(name: string, schema: SchemaDefinition): Promise<void>;
    [key: string]: any;
}
declare function connect(basePath?: string): DBInstance;

type SortOrder = 1 | -1;
declare class QueryBuilder<T = any> {
    private collection;
    private query;
    private _skip;
    private _limit;
    private _sort;
    constructor(collection: Collection<T>, query: any);
    skip(n: number): this;
    limit(n: number): this;
    sort(sortObj: Record<string, SortOrder>): this;
    exec(): Promise<T[]>;
    then(resolve: (value: T[]) => any, reject?: (reason: any) => any): Promise<any>;
    private matchQuery;
    private applyOperators;
}

declare class Collection<T = any> {
    private name;
    private basePath;
    private collectionPath;
    private dataFile;
    private schemaFile;
    constructor(name: string, basePath: string);
    private ensureCollection;
    private readData;
    private writeData;
    find(query?: Partial<T>): QueryBuilder<T>;
    insertOne(doc: T): Promise<T & {
        _id: string;
        createdAt: string;
    }>;
    insertMany(docs: T[]): Promise<(T & {
        _id: string;
        createdAt: string;
    })[]>;
    findOne(query: Partial<T>): Promise<T | null>;
    create(doc: T): Promise<T & {
        _id: string;
        createdAt: string;
    }>;
    updateOne(filter: Partial<T>, update: Partial<T>): Promise<{
        matched: number;
        modified: number;
    }>;
    updateMany(filter: Partial<T>, update: Partial<T>): Promise<{
        matched: number;
        modified: number;
    }>;
    deleteOne(filter: Partial<T>): Promise<{
        deleted: number;
    }>;
    deleteMany(filter: Partial<T>): Promise<{
        deleted: number;
    }>;
    _getAll(): Promise<T[]>;
}

/**
 * Ensure directory exists (mkdir -p)
 */
declare function ensureDir(dirPath: string): void;
/**
 * Ensure JSON file exists, else create with default value
 */
declare function ensureJSONFile(filePath: string, defaultValue?: any): Promise<void>;
/**
 * Read JSON file safely
 */
declare function readJSON<T = any>(filePath: string): Promise<T>;
/**
 * Write JSON file safely
 */
declare function writeJSON(filePath: string, data: any): Promise<void>;
/**
 * Generate simple unique id (can be replaced later with UUID)
 */
declare function generateId(): string;

export { Collection, type DBInstance, type FilterQuery, type PrimitiveType, QueryBuilder, type QueryOperators, type SchemaDefinition, type SortQuery, connect, ensureDir, ensureJSONFile, generateId, readJSON, writeJSON };
