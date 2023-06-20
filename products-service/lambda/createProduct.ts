import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { uid } from 'uid';

import { Product } from '../model/Product';
import { Stock } from '../model/Stock';

const ddb = new DynamoDBClient({ region: process.env.REGION });

type CreateProductRequestItem = Product & { count: number };

const putIntoProducts = (item: Product) => {
  const putCommand = new PutItemCommand({
    TableName: process.env.PRODUCTS_TABLE_NAME as string,
    Item: {
      id: {
        S: item.id,
      },
      title: {
        S: item.title,
      },
      description: {
        S: item.description,
      },
      price: {
        N: item.price.toString(),
      },
    },
    ReturnValues: "ALL_OLD",
  });

  return ddb.send(putCommand);
};

const putIntoStocks = (item: Stock) => {
  const putCommand = new PutItemCommand({
    TableName: process.env.STOCKS_TABLE_NAME as string,
    Item: {
      product_id: {
        S: item.productId,
      },
      count: {
        N: item.count.toString(),
      },
    },
  });

  return ddb.send(putCommand);
};

const validateInputProduct = (item: Record<string, any>): void => {
  if (!item.title) {
    throw new Error("Product title can't be empty");
  }
};

export const handler = async (event: any) => {
  console.log(`POST /products ${event.body}`);

  let item: CreateProductRequestItem;

  try {
    item = JSON.parse(event.body);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  try {
    validateInputProduct(item);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: (err as Error).message,
    };
  }

  const newProduct: Product = {
    title: item.title,
    description: item.description ?? "",
    price: item.price ?? 0,
    id: uid(5),
  };

  try {
    await putIntoProducts(newProduct);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  try {
    await putIntoStocks({ productId: newProduct.id, count: item.count ?? 0 });
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProduct),
  };
};
