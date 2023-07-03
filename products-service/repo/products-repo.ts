import { Product } from "../model/Product";
import { Repo } from "./../model/repo";

export class ProductsRepo extends Repo<Product> {
  async put(item: Product): Promise<Product> {
    return this.dbClient.put(this.tableName, item);
  }

  async batchPut(items: Product[]): Promise<Product[]> {
    return this.dbClient.batchWrite(this.tableName, items);
  }
}
