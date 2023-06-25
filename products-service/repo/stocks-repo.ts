import { Stock } from "../model/Stock";
import { Repo } from "./../model/repo";

export class StocksRepo extends Repo<Stock> {
  async put(item: Stock): Promise<Stock> {
    await this.dbClient.put(this.tableName, {
      product_id: item.productId,
      count: item.count,
    });

    return item;
  }

  async batchPut(items: Stock[]): Promise<Stock[]> {
    await this.dbClient.batchWrite(
      this.tableName,
      items.map((item) => ({
        product_id: item.productId,
        count: item.count,
      }))
    );

    return items;
  }
}
