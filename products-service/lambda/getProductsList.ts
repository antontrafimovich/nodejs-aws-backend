import {
  DynamoDBClient,
  ScanCommandOutput,
  ScanCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { Product } from "../model/Product";
import { Stock } from "../model/Stock";

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
    body: error,
  };
};

const getAttributeValueByKey = (key: string): "S" | "N" => {
  if (key === "count" || key === "price") {
    return "N";
  }

  return "S";
};

const dbProductItemToResponseItem = (
  dbItem: Record<string, AttributeValue>
): Product => {
  return Object.keys(dbItem).reduce((result, next) => {
    return { ...result, [next]: dbItem[next][getAttributeValueByKey(next)] };
  }, {}) as Product;
};

const dbStockItemToResponseItem = (
  dbItem: Record<string, AttributeValue> | undefined
): Stock | null => {
  if (!dbItem) {
    return null;
  }

  return {
    productId: dbItem["product_id"]["S"] as string,
    count: Number(dbItem["count"]["N"]),
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

  if ((products?.Count ?? 0) === 0) {
    return createNotFoundResponse("products");
  }

  if ((stocks?.Count ?? 0) === 0) {
    return createNotFoundResponse("stocks");
  }

  const result = products.Items?.map((item) => {
    const productItem = dbProductItemToResponseItem(item);

    const stock = stocks.Items?.map(dbStockItemToResponseItem).find(
      (stockItem) => stockItem?.productId === productItem.id
    );

    return {
      ...productItem,
      count: stock?.count,
    };
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  };
};
