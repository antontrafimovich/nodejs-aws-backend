import {
  BatchWriteItemCommand,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { DB } from "../model/DB";

export type DynamoDBOptions = {
  region: string;
};

export class DynamoDB extends DB {
  private client: DynamoDBClient;

  constructor({ region }: DynamoDBOptions) {
    super();
    this.client = new DynamoDBClient({ region });
  }

  async put<T>(tableName: string, item: T): Promise<T> {
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
      ReturnValues: "ALL_OLD",
    });

    await this.client.send(putCommand);

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

    await this.client.send(batchCommand);

    return items;
  }
}
