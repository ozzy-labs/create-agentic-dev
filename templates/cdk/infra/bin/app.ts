#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { AppStack } from "../lib/app-stack.js";

const app = new cdk.App();

new AppStack(app, "{{projectName}}", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
