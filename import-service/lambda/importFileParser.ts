import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Transform, Writable } from "stream";
import { pipeline } from "stream/promises";

import { createS3ReadStream } from "../shared";

const client = new S3Client({ region: process.env.REGION });

const copyObject = (
  bucket: string,
  sourceKey: string,
  destinationKey: string
) => {
  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destinationKey,
  });

  return client.send(copyCommand);
};

const deleteObject = (bucket: string, key: string) => {
  const copyCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return client.send(copyCommand);
};

const moveObject = async (
  bucket: string,
  sourceKey: string,
  destinationKey: string
) => {
  try {
    await copyObject(bucket, sourceKey, destinationKey);
  } catch (err) {
    throw err;
  }

  try {
    await deleteObject(bucket, sourceKey);
  } catch (err) {
    throw err;
  }
};

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
      body: `Error with csv parsing: ${(err as Error).message}`,
    };
  }

  const [, objectKey] = params.s3.object.key.split("/");

  try {
    await moveObject(
      params.s3.bucket.name,
      params.s3.object.key,
      `parsed/${objectKey}`
    );
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: `Error with moving object to parse fodler: ${
        (err as Error).message
      }`,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `File reading is done`,
  };
};
