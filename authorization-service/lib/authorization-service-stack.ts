import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path from "node:path";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new NodejsFunction(
      this,
      "basicAuthorizationHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(
          __dirname,
          "../",
          "src",
          "handlers",
          "basicAuthorizer.ts"
        ),
        handler: "handler",
        environment: {
          GITHUB_CREDS: process.env.GITHUB_CREDS as string,
          REGION: process.env.AWS_REGION as string,
        },
      }
    );
  }
}
