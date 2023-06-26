import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { uid } from "uid";

import { productsRepo, stocksRepo } from "../app";

const client = new SNSClient({ region: process.env.REGION });

export const handler = async (event: any) => {
  try {
    const promises = event.Records.map((record: any) => {
      const product = JSON.parse(record.body);

      const id = uid(5);

      return Promise.all([
        productsRepo.put({
          id,
          title: product.title,
          price: parseFloat(product.price),
          description: product.description,
        }),
        stocksRepo.put({ productId: id, count: parseInt(product.count) }),
      ]);
    });

    await Promise.all(promises);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err instanceof Error ? err.message : err,
    };
  }

  const command = new PublishCommand({
    TargetArn: process.env.SNS_ARN,
    Message: "New products were added",
    Subject: "Notification from products service",
  });

  try {
    await client.send(command);
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err instanceof Error ? err.message : err,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "ok",
  };
};
