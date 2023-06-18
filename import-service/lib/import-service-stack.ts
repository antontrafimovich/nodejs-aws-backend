import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "@aws-cdk/aws-apigatewayv2-alpha";

import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import path = require("path");
import {
  MappingValue,
  ParameterMapping,
} from "@aws-cdk/aws-apigatewayv2-alpha";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "ImportServiceBucket", {
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [HttpMethods.PUT],
          allowedHeaders: ["*"],
        },
      ],
    });

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
      },
    });

    const importCSVIntegration = new HttpLambdaIntegration(
      "importCSVIntegration",
      importProductsFileLambda
    );

    http.addRoutes({
      path: "/import",
      integration: importCSVIntegration,
      methods: [apigateway.HttpMethod.GET],
    });
  }
}
