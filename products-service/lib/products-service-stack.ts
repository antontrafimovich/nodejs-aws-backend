import "dotenv/config";

import * as apigateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "node:path";

const PRODUCTS_TABLE_NAME = "AT_Products";
const STOCKS_TABLE_NAME = "AT_Stocks";

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log(`${process.env.DYNAMO_DB_ARN}/${STOCKS_TABLE_NAME}`);

    const getProductsLambda = new NodejsFunction(this, "getProductsHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../", "lambda", "getProductsList.ts"),
      handler: "handler",
      environment: {
        PRODUCTS_TABLE_NAME,
        STOCKS_TABLE_NAME,
        REGION: process.env.REGION as string,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["dynamodb:Scan"],
          resources: [
            `${process.env.DYNAMO_DB_ARN}/${PRODUCTS_TABLE_NAME}`,
            `${process.env.DYNAMO_DB_ARN}/${STOCKS_TABLE_NAME}`,
          ],
        }),
      ],
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb"],
      },
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
            actions: ["dynamodb:Query"],
            resources: [
              `${process.env.DYNAMO_DB_ARN}/${PRODUCTS_TABLE_NAME}`,
              `${process.env.DYNAMO_DB_ARN}/${STOCKS_TABLE_NAME}`,
            ],
          }),
        ],
        environment: {
          PRODUCTS_TABLE_NAME,
          STOCKS_TABLE_NAME,
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

    const createProductLambda = new NodejsFunction(
      this,
      "createProductHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../", "lambda", "createProduct.ts"),
        handler: "handler",
        initialPolicy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["dynamodb:PutItem"],
            resources: [
              `${process.env.DYNAMO_DB_ARN}/${PRODUCTS_TABLE_NAME}`,
              `${process.env.DYNAMO_DB_ARN}/${STOCKS_TABLE_NAME}`,
            ],
          }),
        ],
        environment: {
          PRODUCTS_TABLE_NAME,
          STOCKS_TABLE_NAME,
          REGION: process.env.REGION as string,
        },
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb"],
        },
      }
    );

    const createProductIntegration = new HttpLambdaIntegration(
      "createProductIntegration",
      createProductLambda
    );

    http.addRoutes({
      path: "/products",
      integration: createProductIntegration,
      methods: [apigateway.HttpMethod.POST],
    });
  }
}
