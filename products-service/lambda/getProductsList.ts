import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";

import { Product } from "../model/Product";
import { dbProductItemToResponseItem } from "../utils/product.utils";
import { dbStockItemToResponseItem } from "../utils/stock.utils";

const ddb = new DynamoDBClient({ region: process.env.REGION });

const scanAll = (tableName: string) => {
  const command = new ScanCommand({ TableName: tableName });

  return ddb.send(command);
};

const createNotFoundResponse = (type: "products" | "stocks") => {
  const entity = type === "products" ? "Products" : "Stocks";
  return {
    statusCode: 404,
    headers: { "Content-Type": "text/plain" },
    body: `${entity} haven't been found`,
  };
};

const createServerErrorResponse = (error: Error) => {
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: error.message,
  };
};

export const handler = async (event: any) => {
  let products: ScanCommandOutput;

  try {
    products = await scanAll(process.env.PRODUCTS_TABLE_NAME as string);
  } catch (err) {
    return createServerErrorResponse(err as Error);
  }

  let stocks: ScanCommandOutput;

  try {
    stocks = await scanAll(process.env.STOCKS_TABLE_NAME as string);
  } catch (err) {
    return createServerErrorResponse(err as Error);
  }

  if (!products.Items || products.Items.length === 0) {
    return createNotFoundResponse("products");
  }

  if (!stocks.Items || stocks.Items.length === 0) {
    return createNotFoundResponse("stocks");
  }

  const resultStocks = stocks.Items.map(dbStockItemToResponseItem);

  const result = products.Items.filter((item) => item !== undefined).map(
    (item) => {
      const productItem = dbProductItemToResponseItem(item) as Product;

      const stock = resultStocks.find(
        (stockItem) => stockItem?.productId === productItem.id
      );

      return {
        ...productItem,
        count: stock?.count,
      };
    }
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  };
};
