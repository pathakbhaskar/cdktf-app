import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { 
  provider,
  apiGatewayRestApi,
  apiGatewayResource,
  apiGatewayMethod,
  apiGatewayIntegration,
  apiGatewayDeployment,
  lambdaPermission
} from "@cdktf/provider-aws";
import { LambdaFunction } from "./constructs/LambdaFunction";
import * as path from "path";

class MyStack extends TerraformStack {
  
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new provider.AwsProvider(this, 'aws-provider', {
      region: 'us-east-1',
    });

    // Create Lambda function
    const lambdaFn = new LambdaFunction(this, 'lambda-function', {
      functionName: 'cdktf-name-picker-api',
      filename: path.join(process.env.INIT_CWD!, './function-name-picker/index.js.zip'),
      handler: 'index.handler',
      environment: {
        variables: {
          NAMES: JSON.stringify([
            "AWS Lambda", 
            "Amazon API Gateway", 
            "AWS CDK for Terraform", 
            "Amazon DynamoDB", 
            "Amazon S3", 
            "Amazon CloudFront",
            "AWS IAM",
            "Amazon CloudWatch"
          ]),
          SHUFFLE: "true"
        }
      }
    });

    // Create API Gateway
    const api = new apiGatewayRestApi.ApiGatewayRestApi(this, 'name-picker-api', {
      name: 'name-picker-api',
      description: 'API Gateway for the name picker Lambda function',
    });

    // Create a proxy resource that matches any request path
    const proxyResource = new apiGatewayResource.ApiGatewayResource(this, 'proxy-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: '{proxy+}',
    });

    // Create a method for the proxy resource (ANY)
    const proxyMethod = new apiGatewayMethod.ApiGatewayMethod(this, 'proxy-method', {
      restApiId: api.id,
      resourceId: proxyResource.id,
      httpMethod: 'ANY',
      authorization: 'NONE',
    });

    // Create an integration between the method and the Lambda function
    const proxyIntegration = new apiGatewayIntegration.ApiGatewayIntegration(this, 'lambda-integration', {
      restApiId: api.id,
      resourceId: proxyResource.id,
      httpMethod: proxyMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFn.lambdaFunction.arn}/invocations`,
    });

    // Create a method for the root resource (ANY)
    const rootMethod = new apiGatewayMethod.ApiGatewayMethod(this, 'root-method', {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      httpMethod: 'ANY',
      authorization: 'NONE',
    });

    // Create an integration between the root method and the Lambda function
    const rootIntegration = new apiGatewayIntegration.ApiGatewayIntegration(this, 'root-lambda-integration', {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      httpMethod: rootMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFn.lambdaFunction.arn}/invocations`,
    });

    // Create a deployment for the API Gateway
    const deployment = new apiGatewayDeployment.ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      stageName: 'prod',
      // Add explicit dependencies to ensure the deployment happens after the resources, methods, and integrations are created
      dependsOn: [proxyMethod, rootMethod, proxyIntegration, rootIntegration],
    });

    // Grant permission for API Gateway to invoke the Lambda function
    new lambdaPermission.LambdaPermission(this, 'api-gateway-permission', {
      functionName: lambdaFn.lambdaFunction.functionName,
      action: 'lambda:InvokeFunction',
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // Output the API Gateway URL
    new TerraformOutput(this, 'apiUrl', {
      value: `${deployment.invokeUrl}`,
      description: 'The URL of the API Gateway',
    });

    new TerraformOutput(this, 'helloWorld', {
      value: "Hello World"
    });
  }
}

const app = new App();
new MyStack(app, "sample_cdk_tf");
app.synth();
