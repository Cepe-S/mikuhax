import { Context } from "koa";
import { HeadlessBrowser } from "../../../../lib/browser";

export class BalanceController {
    public async getBalanceStatus(ctx: Context) {
        const { ruid } = ctx.params;
        
        try {
            const browser = HeadlessBrowser.getInstance();
            
            if (!browser.checkExistRoom(ruid)) {
                ctx.status = 404;
                ctx.body = { error: "Room not found" };
                return;
            }

            // Get balance status from the room
            const status = await browser.getBalanceStatus(ruid);
            
            ctx.status = 200;
            ctx.body = status;
        } catch (error) {
            // Log error but don't spam console for balance status requests
            if (error.message && !error.message.includes('balanceManager')) {
                console.error(`Balance status error for ${ruid}:`, error.message);
            }
            ctx.status = 500;
            ctx.body = { error: "Balance system not available" };
        }
    }
}