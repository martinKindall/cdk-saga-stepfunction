#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SagaStepFunctionStack } from '../lib/saga-step-function-stack';

const app = new cdk.App();
new SagaStepFunctionStack(app, 'SagaStepFunctionStack');
