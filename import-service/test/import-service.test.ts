// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as ImportService from '../lib/import-service-stack';
jest.mock("@aws-sdk/s3-request-presigner", () => {
  const original = jest.requireActual("@aws-sdk/s3-request-presigner");

  return {
    __esModule: true,
    ...original,
    getSignedUrl: jest.fn(() => "some url"),
  };
});

jest.mock("@aws-sdk/client-s3", () => {
  const original = jest.requireActual("@aws-sdk/client-s3");

  return {
    __esModule: true,
    ...original,
    S3Client: class S3TestClient {
      constructor(private params: Record<string, any>) {}
    },
    PutObjectCommand: class PutObjectTestCommand {
      constructor(private params: Record<string, any>) {}
    },
  };
});

import { handler as importProductsFileHandler } from "../lambda/importProductsFile";

describe("importProductsFile", () => {
  it("should return error if name query param is not provided", async () => {
    const result = await importProductsFileHandler({
      queryStringParameters: {
        name: undefined,
      },
    });

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual("Filename hasn't been provided");
  });

  it("should return error if name REGION env variable is not provided", async () => {
    const result = await importProductsFileHandler({
      queryStringParameters: {
        name: "test_name",
      },
    });

    expect(result.statusCode).toEqual(500);
    expect(result.body).toEqual("region env var hasn't been provided");
  });

  it("should return error if BUCKET_NAME env variable is not provided", async () => {
    process.env.REGION = "test_region";

    const result = await importProductsFileHandler({
      queryStringParameters: {
        name: "test_name",
      },
    });

    expect(result.statusCode).toEqual(500);
    expect(result.body).toEqual("bucket env var hasn't been provided");
  });

  it("should return signedUrl response if query name and all the required env variables are provided", async () => {
    process.env.REGION = "test_region";
    process.env.BUCKET_NAME = "test_bucket_name";

    const result = await importProductsFileHandler({
      queryStringParameters: {
        name: "test_name",
      },
    });

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual("some url");
  });

  afterAll(() => {
    jest.unmock("@aws-sdk/s3-request-presigner");
    jest.unmock("@aws-sdk/client-s3");
  });
});
