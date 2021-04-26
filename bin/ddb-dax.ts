#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DdbDaxStack } from '../lib/ddb-dax-stack';

const app = new cdk.App();
new DdbDaxStack(app, 'DdbDaxStack', {
  env: {
    region: 'us-west-2',       // change to your preferred region
    account: '999999999999',   // change this to your account ID
  },
  // set these to the values you want to use: 
  daxSubnetIds: ['subnet-00cffda429f0df548', 'subnet-0c6c99165c3d25c30'],   // Required: subnets in which to launch DAX (private subnets recommended)
  daxSecurityGroupIds: ['sg-0b51795b6839ff5b0']                             // Required: Security group(s) to assign to DAX

});
