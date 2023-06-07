import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.REGION });

const query = (id: string) => {
  const command = new QueryCommand({
    TableName: process.env.TABLE_NAME as string,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: { ":id": { S: id } },
  });

  return ddb.send(command);
};

export const handler = async (event: any) => {
  const { productId } = event.pathParameters;

  const queryResults = await query(productId);

  if (queryResults.Count === 0 || !queryResults.Items) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: `Product with id ${productId} doesn't exist`,
    };
  }

  const product = queryResults.Items[0];

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  };
};
