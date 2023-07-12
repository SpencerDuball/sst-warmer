import type { Construct } from "constructs";
import type { SsrSiteProps } from "sst/constructs/SsrSite";
import { RemixSite as _RemixSite, SvelteKitSite as _SvelteKitSite, AstroSite as _AstroSite, SolidStartSite as _SolidStartSite } from "sst/constructs";
export interface SvelteKitSiteProps extends SsrSiteProps {
    /**
     * The number of server functions to keep warm. This option is only supported for the reginal mode.
     */
    warm?: number;
}
export declare class SvelteKitSite extends _SvelteKitSite {
    protected warm?: number;
    constructor(scope: Construct, id: string, { warm, ...props }: SvelteKitSiteProps);
    private createWarmer;
}
export interface RemixSiteProps extends SsrSiteProps {
    /**
     * The number of server functions to keep warm. This option is only supported for the reginal mode.
     */
    warm?: number;
}
export declare class RemixSite extends _RemixSite {
    protected warm?: number;
    constructor(scope: Construct, id: string, { warm, ...props }: RemixSiteProps);
    private createWarmer;
}
export interface AstroSiteProps extends SsrSiteProps {
    /**
     * The number of server functions to keep warm. This option is only supported for the reginal mode.
     */
    warm?: number;
}
export declare class AstroSite extends _AstroSite {
    protected warm?: number;
    constructor(scope: Construct, id: string, { warm, ...props }: AstroSiteProps);
    private createWarmer;
}
export interface SolidStartSiteProps extends SsrSiteProps {
    /**
     * The number of server functions to keep warm. This option is only supported for the reginal mode.
     */
    warm?: number;
}
export declare class SolidStartSite extends _SolidStartSite {
    protected warm?: number;
    constructor(scope: Construct, id: string, { warm, ...props }: SolidStartSiteProps);
    private createWarmer;
}
