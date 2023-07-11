import type { Construct } from "constructs";
import { SsrSite, type SsrSiteProps } from "sst/constructs/SsrSite";
import { SsrFunction } from "sst/constructs/SsrFunction";
import {
  RemixSite as _RemixSite,
  SvelteKitSite as _SvelteKitSite,
  AstroSite as _AstroSite,
  SolidStartSite as _SolidStartSite,
  Stack,
} from "sst/constructs";
import { Function as CdkFunction, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration as CdkDuration, CustomResource } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import path from "path";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

/**
 * This function is agnostic of the parent SsrSite and can warm lambdas.
 *
 * @param site The SsrSite
 * @param edge The edge prop
 * @param warm The number of instances to keep warm
 * @param serverLambdaForRegional The server lambda
 * @returns Nada
 */
function createWarmer(
  site: SsrSite,
  edge?: boolean,
  warm?: number,
  serverLambdaForRegional?: CdkFunction | SsrFunction
) {
  if (!warm) return;

  if (warm && edge) throw new Error(`Warming is currently supported only for the regional mode.`);

  if (!serverLambdaForRegional) return;

  // create warmer function
  const warmer = new CdkFunction(site, "WarmerFunction", {
    description: "Server handler warmer",
    code: Code.fromAsset(path.join(__dirname, "../dist/support/warmer-function")),
    runtime: Runtime.NODEJS_18_X,
    handler: "index.handler",
    timeout: CdkDuration.minutes(15),
    memorySize: 1024,
    environment: {
      FUNCTION_NAME:
        serverLambdaForRegional instanceof SsrFunction
          ? serverLambdaForRegional.function.functionName
          : serverLambdaForRegional.functionName,
      CONCURRENCY: warm.toString(),
    },
  });
  if (serverLambdaForRegional instanceof SsrFunction) serverLambdaForRegional.function.grantInvoke(warmer);
  else serverLambdaForRegional.grantInvoke(warmer);

  // create cron job
  new Rule(site, "WarmerRule", {
    schedule: Schedule.rate(CdkDuration.minutes(5)),
    targets: [new LambdaFunction(warmer, { retryAttempts: 0 })],
  });

  // create custom resource to prewarm on deploy
  const stack = Stack.of(site) as Stack;
  const policy = new Policy(stack, "PrewarmerPolicy", {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["lambda:InvokeFunction"],
        resources: [warmer.functionArn],
      }),
    ],
  });
  stack.customResourceHandler.role?.attachInlinePolicy(policy);
  const resource = new CustomResource(stack, "Prewarmer", {
    serviceToken: stack.customResourceHandler.functionArn,
    resourceType: "Custom::FunctionInvoker",
    properties: {
      version: Date.now().toString(),
      functionName: warmer.functionName,
    },
  });
  resource.node.addDependency(policy);
}

// -------------------------------------------------------------------------------------------------------------
// SvelteKitSite
// -------------------------------------------------------------------------------------------------------------
export interface SvelteKitSiteProps extends SsrSiteProps {
  /**
   * The number of server functions to keep warm. This option is only supported for the reginal mode.
   */
  warm?: number;
}
export class SvelteKitSite extends _SvelteKitSite {
  protected warm?: number;

  constructor(scope: Construct, id: string, { warm, ...props }: SvelteKitSiteProps) {
    super(scope, id, props);
    this.warm = warm;
    this.createWarmer();
  }

  private createWarmer() {
    createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
  }
}

// -------------------------------------------------------------------------------------------------------------
// RemixSite
// -------------------------------------------------------------------------------------------------------------
export interface RemixSiteProps extends SsrSiteProps {
  /**
   * The number of server functions to keep warm. This option is only supported for the reginal mode.
   */
  warm?: number;
}
export class RemixSite extends _RemixSite {
  protected warm?: number;

  constructor(scope: Construct, id: string, { warm, ...props }: RemixSiteProps) {
    super(scope, id, props);
    this.warm = warm;
    this.createWarmer();
  }

  private createWarmer() {
    createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
  }
}

// -------------------------------------------------------------------------------------------------------------
// AstroSite
// -------------------------------------------------------------------------------------------------------------
export interface AstroSiteProps extends SsrSiteProps {
  /**
   * The number of server functions to keep warm. This option is only supported for the reginal mode.
   */
  warm?: number;
}
export class AstroSite extends _AstroSite {
  protected warm?: number;

  constructor(scope: Construct, id: string, { warm, ...props }: AstroSiteProps) {
    super(scope, id, props);
    this.warm = warm;
    this.createWarmer();
  }

  private createWarmer() {
    createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
  }
}

// -------------------------------------------------------------------------------------------------------------
// SolidSite
// ------------------------------------------------------------------------------------------------------------
export interface SolidStartSiteProps extends SsrSiteProps {
  /**
   * The number of server functions to keep warm. This option is only supported for the reginal mode.
   */
  warm?: number;
}
export class SolidStartSite extends _SolidStartSite {
  protected warm?: number;

  constructor(scope: Construct, id: string, { warm, ...props }: SolidStartSiteProps) {
    super(scope, id, props);
    this.warm = warm;
    this.createWarmer();
  }

  private createWarmer() {
    createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
  }
}
