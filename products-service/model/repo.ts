import { DB } from "./DB";

export abstract class Repo<T> {
  constructor(
    protected readonly dbClient: DB,
    protected readonly tableName: string
  ) {}

  abstract put(item: T): Promise<T>;

  abstract batchPut(items: T[]): Promise<T[]>;
}
