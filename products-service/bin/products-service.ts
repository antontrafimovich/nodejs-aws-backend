#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProductsServiceStack } from "../lib/products-service-stack";

import "dotenv/config";

const app = new cdk.App();
new ProductsServiceStack(app, "ProductsServiceStack", {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});
