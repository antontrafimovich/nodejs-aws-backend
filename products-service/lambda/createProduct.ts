import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { uid } from "uid";

import { Product } from "../model/Product";

const ddb = new DynamoDBClient({ region: process.env.REGION });

const put = (item: Omit<Product, "id">) => {
  const putCommand = new PutItemCommand({
    TableName: process.env.TABLE_NAME as string,
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

export const handler = async (event: any) => {
  let item;

  try {
    item = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: err,
    };
  }

  let putResult;

  try {
    putResult = await put(item);
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: err,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  };
};
