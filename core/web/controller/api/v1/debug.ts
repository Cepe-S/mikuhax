import { Context } from "koa";
import { HeadlessBrowser } from "../../../../lib/browser";

export class DebugController {
    public async getDebugStatus(ctx: Context) {
        const { ruid } = ctx.params;
        
        try {
            const browser = HeadlessBrowser.getInstance();
            
            if (!browser.checkExistRoom(ruid)) {
                ctx.status = 404;
                ctx.body = { error: "Room not found" };
                return;
            }

            // Get debug status from all systems
            const debugStatus = await browser.getDebugStatus(ruid);
            
            // Add mute system debug info
            const muteDebugInfo = await browser.getMuteDebugInfo(ruid);
            if (muteDebugInfo) {
                debugStatus.mute = muteDebugInfo;
            }
            
            ctx.status = 200;
            ctx.body = debugStatus;
        } catch (error) {
            console.error(`Debug status error for ${ruid}:`, error.message);
            ctx.status = 500;
            ctx.body = { error: "Debug system not available" };
        }
    }
}