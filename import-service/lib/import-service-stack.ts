import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import path = require("path");

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importCSVLambda = new NodejsFunction(this, "importCSVHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../", "lambda", "importProductsFile.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb"],
      },
    });

    const bucket = new Bucket(this, "ImportCSVBucket");
    bucket.grantWrite(importCSVLambda);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ImportServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
