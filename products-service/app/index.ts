import { DynamoDB } from "../db";
import { ProductsRepo, StocksRepo } from "../repo";

const db = new DynamoDB({
  region: process.env.AWS_REGION as string,
});

export const productsRepo = new ProductsRepo(
  db,
  process.env.PRODUCTS_TABLE_NAME as string
);

export const stocksRepo = new StocksRepo(
  db,
  process.env.STOCKS_TABLE_NAME as string
);
