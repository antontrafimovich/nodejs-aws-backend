import "dotenv/config";

import * as apigateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import * as path from "node:path";

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, "createProductTopic");
    topic.addSubscription(
      new subscriptions.EmailSubscription(process.env.EMAIL_TO_NOTIFY as string)
    );

    const dynamoDbProductsTable = dynamodb.Table.fromTableArn(
      this,
      "productsTable",
      `${process.env.PRODUCTS_DYNAMO_DB_ARN}`
    );

    const dynamoDbStocksTable = dynamodb.Table.fromTableArn(
      this,
      "stocksTable",
      `${process.env.STOCKS_DYNAMO_DB_ARN}`
    );

    const [, productsTableName] = (
      process.env.PRODUCTS_DYNAMO_DB_ARN ?? ""
    ).split("/");

    const [, stocksTableName] = (process.env.STOCKS_DYNAMO_DB_ARN ?? "").split(
      "/"
    );

    const getProductsLambda = new NodejsFunction(this, "getProductsHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../", "lambda", "getProductsList.ts"),
      handler: "handler",
      environment: {
        PRODUCTS_TABLE_NAME: productsTableName,
        STOCKS_TABLE_NAME: stocksTableName,
        REGION: process.env.REGION as string,
      },
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb"],
      },
    });

    dynamoDbProductsTable.grantReadData(getProductsLambda);
    dynamoDbStocksTable.grantReadData(getProductsLambda);

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

        environment: {
          PRODUCTS_TABLE_NAME: productsTableName,
          STOCKS_TABLE_NAME: stocksTableName,
          REGION: process.env.REGION as string,
        },
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb"],
        },
      }
    );

    dynamoDbProductsTable.grantReadData(getProductsByIdLambda);
    dynamoDbStocksTable.grantReadData(getProductsByIdLambda);

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
        environment: {
          PRODUCTS_TABLE_NAME: productsTableName,
          STOCKS_TABLE_NAME: stocksTableName,
          REGION: process.env.REGION as string,
        },
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb"],
        },
      }
    );

    dynamoDbProductsTable.grantWriteData(createProductLambda);
    dynamoDbStocksTable.grantWriteData(createProductLambda);

    const createProductIntegration = new HttpLambdaIntegration(
      "createProductIntegration",
      createProductLambda
    );

    http.addRoutes({
      path: "/products",
      integration: createProductIntegration,
      methods: [apigateway.HttpMethod.POST],
    });

    const catalogBatchProcessLambda = new NodejsFunction(
      this,
      "catalogBatchProcessHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../", "lambda", "catalogBatchProcess.ts"),
        handler: "handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTableName,
          STOCKS_TABLE_NAME: stocksTableName,
          REGION: process.env.REGION as string,
          SNS_ARN: topic.topicArn,
        },
        bundling: {
          externalModules: [
            "@aws-sdk/client-dynamodb",
            "@aws-sdk/util-dynamodb",
            "@aws-sdk/client-sns"
          ],
        },
      }
    );

    topic.grantPublish(catalogBatchProcessLambda);

    dynamoDbProductsTable.grantWriteData(catalogBatchProcessLambda);
    dynamoDbStocksTable.grantWriteData(catalogBatchProcessLambda);

    const catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue");
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    const catalogItemsQueueEventSource = new lambdaEventSources.SqsEventSource(
      catalogItemsQueue,
      { batchSize: 5 }
    );
    catalogBatchProcessLambda.addEventSource(catalogItemsQueueEventSource);
  }
}
