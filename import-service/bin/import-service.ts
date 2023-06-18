#!/usr/bin/env node
import "dotenv/config";
import "source-map-support/register";

import * as cdk from "aws-cdk-lib";

import { ImportServiceStack } from "../lib/import-service-stack";

const app = new cdk.App();
new ImportServiceStack(app, "ImportServiceStack", {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});
