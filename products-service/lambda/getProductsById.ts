import { DynamoDBClient, QueryCommand, QueryCommandOutput } from '@aws-sdk/client-dynamodb';

import { dbProductItemToResponseItem } from '../utils/product.utils';
import { dbStockItemToResponseItem } from '../utils/stock.utils';

const ddb = new DynamoDBClient({ region: process.env.REGION });

const queryProduct = (id: string) => {
  const command = new QueryCommand({
    TableName: process.env.PRODUCTS_TABLE_NAME,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: { ":id": { S: id } },
  });

  return ddb.send(command);
};
const queryStock = (id: string) => {
  const command = new QueryCommand({
    TableName: process.env.STOCKS_TABLE_NAME,
    KeyConditionExpression: "product_id = :id",
    ExpressionAttributeValues: { ":id": { S: id } },
  });

  return ddb.send(command);
};

export const handler = async (event: any) => {
  const { productId } = event.pathParameters;

  console.log(`GET /products/${productId} pathParameter: id=${productId}`);

  let product: QueryCommandOutput;

  try {
    product = await queryProduct(productId);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  let stock: QueryCommandOutput;

  try {
    stock = await queryStock(productId);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  const resultProduct = dbProductItemToResponseItem(product.Items?.[0]);

  if (!resultProduct) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: `Product with id ${productId} doesn't exist`,
    };
  }

  const resultStock = dbStockItemToResponseItem(stock.Items?.[0]);

  if (!resultStock) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: `There's no stock for product with id ${productId}`,
    };
  }

  const result = {
    ...resultProduct,
    count: resultStock.count,
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  };
};
