import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DatabaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'AT_Products', {
      tableName: 'AT_Products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'title', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    });

    new cdk.custom_resources.AwsCustomResource(this, 'AT_Products_Init_Data', {
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters: {
          TableName: table.tableName,
          Item: {
            id: {S: "647cfe58c1a3d1e43204df53"},
            title: {S: "eiusmod"},
            
          }
        }
      }
    })

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'DatabaseQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
