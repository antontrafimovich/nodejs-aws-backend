import "dotenv/config";

import * as apigateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "node:path";

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsLambda = new NodejsFunction(this, "getProductsHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../", "lambda", "getProductsList.ts"),
      handler: "handler",
    });

    const getProductsIntegration = new HttpLambdaIntegration(
      "getProductsIntegration",
      getProductsLambda
    );

    const http = new apigateway.HttpApi(this, "ProductsServiceHTTP", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
      },
    });

    http.addRoutes({
      path: "/products",
      integration: getProductsIntegration,
      methods: [apigateway.HttpMethod.GET],
    });

    const getProductsByIdLambda = new NodejsFunction(
      this,
      "getProductsByIdHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../", "lambda", "getProductsById.ts"),
        handler: "handler",
        initialPolicy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["dynamodb:GetItem", "dynamodb:Query"],
            resources: [process.env.DYNAMO_DB_TABLE_ARN as string],
          }),
        ],
        environment: {
          TABLE_NAME: "AT_Products",
          REGION: process.env.REGION as string,
        },
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb"],
        },
      }
    );

    const getProductsByIdIntegration = new HttpLambdaIntegration(
      "getProductsByIdIntegration",
      getProductsByIdLambda
    );

    http.addRoutes({
      path: "/products/{productId}",
      integration: getProductsByIdIntegration,
      methods: [apigateway.HttpMethod.GET],
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ProductsServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
