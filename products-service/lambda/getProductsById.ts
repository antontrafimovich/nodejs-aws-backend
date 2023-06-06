import * as sdk from "aws-sdk";

const ddb = new sdk.DynamoDB.DocumentClient();

const query = async (id: string) => {
  const queryResults = await ddb
    .query({
      TableName: process.env.TABLE_NAME as string,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeNames: { ":id": id },
    })
    .promise();

  return queryResults;
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
