import { S3Client } from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Transform, Writable } from "stream";
import { pipeline } from "stream/promises";

import { createS3ReadStream } from "../shared";

const client = new S3Client({ region: process.env.REGION });

export const handler = async (event: any) => {
  console.log(JSON.stringify(event));

  const [params] = event.Records;

  try {
    await pipeline(
      createS3ReadStream(client, params.s3.bucket.name, params.s3.object.key),
      new Transform({
        transform: (chunk, _, callback) => {
          console.log(chunk.toString("utf8"));
          callback(null, chunk);
        },
      }),
      csv(),
      new Writable({
        write(chunk, _, callback) {
          console.log(chunk);
          callback(null);
        },
        objectMode: true,
      })
    );
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: `Some problem with a stream: ${(err as Error).message}`,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `File reading is done`,
  };
};
