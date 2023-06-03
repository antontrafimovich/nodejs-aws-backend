import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';


// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const getProductsLambda = new lambda.Function(this, 'ProductsServiceAPI', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'get-products.handler'
    })

    const productsIntegration = new HttpLambdaIntegration('ProductsIntegration', getProductsLambda);

    const http = new apigateway.HttpApi(this, 'ProductsServiceHTTP');

    http.addRoutes({
      path: '/products',
      integration: productsIntegration,
      methods: [apigateway.HttpMethod.GET]
    })


    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ProductsServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
