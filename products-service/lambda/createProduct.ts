import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { uid } from "uid";

import { Product } from "../model/Product";

const ddb = new DynamoDBClient({ region: process.env.REGION });

const put = (item: Omit<Product, "id">) => {
  const putCommand = new PutItemCommand({
    TableName: process.env.PRODUCTS_TABLE_NAME as string,
    Item: {
      id: {
        S: uid(5),
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

  let item;

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
      body: JSON.stringify((err as Error).message),
    };
  }

  let putResult;

  try {
    putResult = await put({
      title: item.title,
      description: item.description,
      price: item.price,
    });
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(err.$metadata.message),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  };
};
