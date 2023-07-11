"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolidStartSite = exports.AstroSite = exports.RemixSite = exports.SvelteKitSite = void 0;
const constructs_1 = require("sst/constructs");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const path_1 = __importDefault(require("path"));
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const url_1 = __importDefault(require("url"));
const __dirname = url_1.default.fileURLToPath(new URL(".", import.meta.url));
/**
 * This function is agnostic of the parent SsrSite and can warm lambdas.
 *
 * @param site The SsrSite
 * @param edge The edge prop
 * @param warm The number of instances to keep warm
 * @param serverLambdaForRegional The server lambda
 * @returns Nada
 */
function createWarmer(site, edge, warm, serverLambdaForRegional) {
    if (!warm)
        return;
    if (warm && edge)
        throw new Error(`Warming is currently supported only for the regional mode.`);
    if (!serverLambdaForRegional)
        return;
    // create warmer function
    const warmer = new aws_lambda_1.Function(site, "WarmerFunction", {
        description: "Server handler warmer",
        code: aws_lambda_1.Code.fromAsset(path_1.default.join(__dirname, "../dist/support/warmer-function")),
        runtime: aws_lambda_1.Runtime.NODEJS_18_X,
        handler: "index.handler",
        timeout: aws_cdk_lib_1.Duration.minutes(15),
        memorySize: 1024,
        environment: {
            FUNCTION_NAME: serverLambdaForRegional.functionName,
            CONCURRENCY: warm.toString(),
        },
    });
    serverLambdaForRegional.grantInvoke(warmer);
    // create cron job
    new aws_events_1.Rule(site, "WarmerRule", {
        schedule: aws_events_1.Schedule.rate(aws_cdk_lib_1.Duration.minutes(5)),
        targets: [new aws_events_targets_1.LambdaFunction(warmer, { retryAttempts: 0 })],
    });
    // create custom resource to prewarm on deploy
    const stack = constructs_1.Stack.of(site);
    const policy = new aws_iam_1.Policy(stack, "PrewarmerPolicy", {
        statements: [
            new aws_iam_1.PolicyStatement({
                effect: aws_iam_1.Effect.ALLOW,
                actions: ["lambda:InvokeFunction"],
                resources: [warmer.functionArn],
            }),
        ],
    });
    stack.customResourceHandler.role?.attachInlinePolicy(policy);
    const resource = new aws_cdk_lib_1.CustomResource(stack, "Prewarmer", {
        serviceToken: stack.customResourceHandler.functionArn,
        resourceType: "Custom::FunctionInvoker",
        properties: {
            version: Date.now().toString(),
            functionName: warmer.functionName,
        },
    });
    resource.node.addDependency(policy);
}
class SvelteKitSite extends constructs_1.SvelteKitSite {
    constructor(scope, id, { warm, ...props }) {
        super(scope, id, props);
        this.warm = warm;
        this.createWarmer();
    }
    createWarmer() {
        createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
    }
}
exports.SvelteKitSite = SvelteKitSite;
class RemixSite extends constructs_1.RemixSite {
    constructor(scope, id, { warm, ...props }) {
        super(scope, id, props);
        this.warm = warm;
        this.createWarmer();
    }
    createWarmer() {
        createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
    }
}
exports.RemixSite = RemixSite;
class AstroSite extends constructs_1.AstroSite {
    constructor(scope, id, { warm, ...props }) {
        super(scope, id, props);
        this.warm = warm;
        this.createWarmer();
    }
    createWarmer() {
        createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
    }
}
exports.AstroSite = AstroSite;
class SolidStartSite extends constructs_1.SolidStartSite {
    constructor(scope, id, { warm, ...props }) {
        super(scope, id, props);
        this.warm = warm;
        this.createWarmer();
    }
    createWarmer() {
        createWarmer(this, this.props.edge, this.warm, this.serverLambdaForRegional);
    }
}
exports.SolidStartSite = SolidStartSite;
