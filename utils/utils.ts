import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';


export const getConstructName = (scope: Construct, id: string) => {
  const stack = TerraformStack.of(scope);
  // Use the stack's node id as a string identifier
  const stackName = stack.node.id || 'default';
  return `${stackName}_${id}`;
};