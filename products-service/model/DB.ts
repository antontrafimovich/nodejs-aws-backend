export abstract class DB {
  abstract put<T>(tableName: string, item: T): Promise<T>;

  abstract batchWrite<T>(tableName: string, items: T[]): Promise<T[]>;
}
