import * as cdk from '@aws-cdk/core';
import * as path from 'path';
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as dax from "@aws-cdk/aws-dax";
import * as logs from '@aws-cdk/aws-logs';
import * as cr from '@aws-cdk/custom-resources';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';

interface StackProps extends cdk.StackProps {
  daxSubnetIds: string[]
  daxSecurityGroupIds: string[]
}

export class DdbDaxStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const ddbTable = new ddb.Table(this, "DynamoDB-Table", {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: "pk",
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: ddb.AttributeType.STRING
      }
    });

    const daxRole = new iam.Role(this, 'DaxRole', {
      assumedBy: new iam.ServicePrincipal('dax.amazonaws.com'),
      description: 'service role for DAX demo',
    });

    daxRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:*'
      ],
      resources: [
        ddbTable.tableArn
      ]
    }));

    const daxSubnetGroup = new dax.CfnSubnetGroup(this, 'DaxSubnetGroup', {
      description: 'Private subnets for DAX demo',
      subnetIds: props.daxSubnetIds,
      subnetGroupName: 'dax-test-group'
    });

    //At this time, CDK only supports L1 CloudFormation-style constructs: 
    const daxCache = new dax.CfnCluster(this, 'DaxCluster', {
      iamRoleArn: daxRole.roleArn,
      description: 'DAX cluster for DynamoDB demo',
      nodeType: 'dax.t3.small',
      replicationFactor: 1,
      securityGroupIds: props.daxSecurityGroupIds,
      subnetGroupName: daxSubnetGroup.ref
    });

    // Lambda function will seed our table with sample data:
    const seedFunction = new lambda.Function(this, "SeedFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/seed-function')),
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: ddbTable.tableName,
      },
      initialPolicy: [new iam.PolicyStatement({
        actions: ['dynamodb:*'],
        effect: iam.Effect.ALLOW,
        resources: [ddbTable.tableArn]
      })]
    });

    const seedFunctionProvider = new cr.Provider(this, 'SeedFunctionProvider', {
      onEventHandler: seedFunction,
      logRetention: logs.RetentionDays.ONE_DAY   // default is INFINITE
    });

    const mySeedFunctionResource = new cdk.CustomResource(this, "SeedFunctionResource", { 
      serviceToken: seedFunctionProvider.serviceToken,
      properties: {
        SomeProperty: "1234"   // changing this value will cause resource to re-run, useful if/when we change code in Lambda
      }
    });

  }
}
