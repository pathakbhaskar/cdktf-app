import {
    apiGatewayRestApi,
    apiGatewayDeployment,
    apiGatewayResource,
    apiGatewayMethod,
    apiGatewayIntegration,
    lambdaPermission,
    lambdaFunction,
  } from '@cdktf/provider-aws';
  
  // Todo: Implement reusable getConstructName function
import { getConstructName } from '../utils/utils';
import { Construct } from 'constructs';

  
  interface LambdaRestApiProps {
    handler: lambdaFunction.LambdaFunction;
    stageName: string;
  }
  
  
  export class LambdaRestApi extends Construct {
    public readonly url: string;
  
    
  
    constructor(scope: Construct, id: string, { handler, stageName }: LambdaRestApiProps) {
      super(scope, id);
  
  
      // Create REST API with a unique name using the utility function
      const restApi = new apiGatewayRestApi.ApiGatewayRestApi(this, 'rest-api', {
        name: getConstructName(this, 'rest-api'),
      });
  
  
      // Attach a Lambda integration to the root resource
      this.createApiGatewayLambdaMethod('root', restApi, restApi.rootResourceId, handler);
  
  
      // Create a proxy resource for dynamic paths
      const proxyResource = new apiGatewayResource.ApiGatewayResource(this, 'proxy-resource', {
        restApiId: restApi.id,
        parentId: restApi.rootResourceId,
        pathPart: '{proxy+}',
      });
  
  
      // Attach a Lambda integration to the proxy resource
      this.createApiGatewayLambdaMethod('proxy-resource', restApi, proxyResource.id, handler);
  
  
      // Add Lambda permission to allow API Gateway to invoke the Lambda function
      new lambdaPermission.LambdaPermission(this, 'api-gateway-permission', {
        action: 'lambda:InvokeFunction',
        functionName: handler.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${restApi.executionArn}/*/*`,
      });
  
  
      // Create API deployment and ensure it waits for necessary dependencies.
      const deployment = new apiGatewayDeployment.ApiGatewayDeployment(this, 'deployment', {
        restApiId: restApi.id,
        stageName,
        dependsOn: [proxyResource, handler],
      });
  
  
      // Expose the API's invoke URL as a public property
      this.url = deployment.invokeUrl;
    }
  
  
    private createApiGatewayLambdaMethod(
      idPrefix: string,
      restApi: apiGatewayRestApi.ApiGatewayRestApi,
      resourceId: string,
      apiLambda: lambdaFunction.LambdaFunction,
    ) {
      // Create the API method with ANY HTTP method and no authorization
      new apiGatewayMethod.ApiGatewayMethod(this, `${idPrefix}-method`, {
        restApiId: restApi.id,
        resourceId,
        httpMethod: 'ANY',
        authorization: 'NONE',
      });
  
  
      // Integrate the method with the Lambda function using AWS_PROXY integration type
      new apiGatewayIntegration.ApiGatewayIntegration(this, `${idPrefix}-lambda-integration`, {
        restApiId: restApi.id,
        resourceId,
        httpMethod: 'ANY',
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: apiLambda.invokeArn,
      });
    
    }
  }