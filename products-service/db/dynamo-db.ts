import {
  BatchWriteItemCommand,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { DB } from "../model/DB";

const ddb = new DynamoDBClient({ region: process.env.REGION });

export class DynamoDB extends DB {
  async put<T>(tableName: string, item: T): Promise<T> {
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
      ReturnValues: "ALL_OLD",
    });

    await ddb.send(putCommand);

    return item;
  }

  async batchWrite<T>(tableName: string, items: T[]): Promise<T[]> {
    const batchCommand = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: items.map((item) => ({
          PutRequest: {
            Item: marshall(item),
          },
        })),
      },
    });

    await ddb.send(batchCommand);

    return items;
  }
}
