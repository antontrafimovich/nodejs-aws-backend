import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";

import { productsRepo, stocksRepo } from "../app";

const client = new SNSClient({ region: process.env.REGION });

export const handler = async (event: any) => {
  try {
    const promises = event.Records.map(async (record: any) => {
      const product = JSON.parse(record.body);

      const id = uuidv4();

      await Promise.all([
        productsRepo.put({
          id,
          title: product.title,
          price: parseFloat(product.price),
          description: product.description,
        }),
        stocksRepo.put({ productId: id, count: parseInt(product.count) }),
      ]);

      const command = new PublishCommand({
        TargetArn: process.env.SNS_ARN,
        Message: `New product was added: \n ${JSON.stringify(product)})}`,
        Subject: "Notification from products service",
        MessageAttributes: {
          count: {
            DataType: "Number",
            StringValue: product.count,
          },
        },
      });

      await client.send(command);
    });

    await Promise.all(promises);
  } catch (err: any) {
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
