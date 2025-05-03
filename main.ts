import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { provider } from '@cdktf/provider-aws';
import { LambdaFunction } from './constructs/LambdaFunction';
import * as path from 'path';
import { getConstructName } from './utils/utils';
import { LambdaRestApi } from './constructs/LambdaRestApi';


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    // Define resources here

    new provider.AwsProvider(this, 'aws-provider', {
      region: 'us-east-1',
    });

    const functionNamePicker = new LambdaFunction(this, 'lambda-function', {
      functionName: getConstructName(scope, 'api'),
      filename: path.join(process.env.INIT_CWD!,'./function-name-picker/index.js.zip'),
      handler: 'index.handler',

    });

    new LambdaRestApi(this, 'lambda-rest-api', {
      handler: functionNamePicker.lambdaFunction,
      stageName: 'dev',
    });

    new TerraformOutput(this, 'lets-go', { value: 'lets go!' });
  }
}


const app = new App();
new MyStack(app, 'cdktf-name-picker');
app.synth();