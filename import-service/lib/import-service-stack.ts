import * as apigateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket, EventType, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import path from "path";
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "ImportServiceBucket", {
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [HttpMethods.PUT, HttpMethods.GET, HttpMethods.HEAD],
          allowedHeaders: ["*"],
        },
      ],
    });

    const queue = sqs.Queue.fromQueueArn(
      this,
      "importServiceCatalogItemsQueue",
      process.env.QUEUE_ARN as string
    );

    const importProductsFileLambda = new NodejsFunction(
      this,
      "importProductsFileHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../", "lambda", "importProductsFile.ts"),
        handler: "handler",
        bundling: {
          externalModules: [
            "@aws-sdk/client-s3",
            "@aws-sdk/s3-request-presigner",
          ],
        },
        environment: {
          REGION: process.env.AWS_REGION as string,
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    bucket.grantWrite(importProductsFileLambda);

    const http = new apigateway.HttpApi(this, "ImportServiceHTTP", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ["*"],
      },
    });

    const importCSVIntegration = new HttpLambdaIntegration(
      "importCSVIntegration",
      importProductsFileLambda
    );

    const authorizationLambda = lambda.Function.fromFunctionArn(
      this,
      "autohorizerLambda",
      process.env.AUTHORIZER_ARN as string
    );

    const authorizer = new HttpLambdaAuthorizer(
      "importCSVFileAuthorizer",
      authorizationLambda,
      {
        responseTypes: [HttpLambdaResponseType.SIMPLE],
      }
    );

    http.addRoutes({
      path: "/import",
      integration: importCSVIntegration,
      methods: [apigateway.HttpMethod.GET],
      authorizer,
    });

    const importFileParserLambda = new NodejsFunction(
      this,
      "importFileParserHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../", "lambda", "importFileParser.ts"),
        handler: "handler",
        bundling: {
          externalModules: ["@aws-sdk/client-s3", "@aws-sdk/client-sqs"],
        },
        environment: {
          REGION: process.env.AWS_REGION as string,
          BUCKET_NAME: bucket.bucketName,
          QUEUE_URL: queue.queueUrl,
        },
      }
    );

    queue.grantSendMessages(importFileParserLambda);

    bucket.grantReadWrite(importFileParserLambda);
    bucket.grantDelete(importFileParserLambda);

    importFileParserLambda.addEventSource(
      new S3EventSource(bucket, {
        events: [EventType.OBJECT_CREATED],
        filters: [{ prefix: "uploaded/" }],
      })
    );
  }
}
