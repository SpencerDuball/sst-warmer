# sst-warmer

This is a simple package that simply extends an `SsrSite` construct from SST and allows you to keep a specified number of functions warm. Keeping lambdas warm can help with cold starts and the benefits are most evident when the lambda's bundle size is large, read more about how warming works and the associated costs [in this post by Open Next](https://github.com/serverless-stack/open-next#how-warming-works).

If you want to keep any of the following SST-deployed sites warm than this package is for you!

- `RemixSite`
- `SvelteKitSite`
- `AstroSite`
- `SolidStartSite`

If you want to keep a `NextjsSite` warm then you are in luck! This is already supported via SST, see [the documentation](https://docs.sst.dev/constructs/NextjsSite#warming) to learn more.

> This package exists only to bridge the gap unil [this issue](https://github.com/serverless-stack/sst/issues/2988) is closed, note that a PR is out already [here](https://github.com/serverless-stack/sst/pull/2996) as well. The API for this package matches exactly with the PR referenced above, so when SST supports this natively you can seamlessly remove this package and upgrade. I mostly just wanted to speed my site up in the meantime and figured I would package this up & share as it was a request feature in the SST discord.

## Installation

```bash
npm install sst-warmer
```

## Usage

This package is pretty simple, just ensure that you have the appropriate peer dependencies installed:

- `"aws-cdk-lib": ">=2.24"`,
- `"constructs": ">=10.1.0"`,
- `"sst": ">=2.11.16"`

Then you can import the "warm" version of the site you want to create, and use it. Since this packages declares `sst` as a peer dependency it should be compatible with any version of SST so long as you meet the peer dependency requirements, this also means it will be a drop in replacement for your current site construct with the only difference noticable is the added `warm` prop.

```ts
// This was your old construct ...
import { RemixSite } from "sst/constructs";

const site = new RemixSite(stack, "web", {
  path: "packages/web/",
  customDomain: app.stage === "prod" ? domainName : undefined,
  cdk: { server: { architecture: Architecture.ARM_64 } },
  environment: SiteEnv,
});

// .. and this is the construct with warming
import { RemixSite } from "sst-warmer";

const site = new RemixSite(stack, "web", {
  path: "packages/web/",
  customDomain: app.stage === "prod" ? domainName : undefined,
  cdk: { server: { architecture: Architecture.ARM_64 } },
  environment: SiteEnv,
  warm: 5, // + we will keep 5 lambda warm
});
```
