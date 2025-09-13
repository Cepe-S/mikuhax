import { Context } from "koa";
import { HeadlessBrowser } from "../../../../lib/browser";

export async function getAllBans(ctx: Context) {
    const { ruid } = ctx.params;
    const { start, count } = ctx.request.query;
    
    try {
        const browser = HeadlessBrowser.getInstance();
        if (!browser.checkExistRoom(ruid)) {
            ctx.status = 404;
            ctx.body = { error: 'Room not found' };
            return;
        }
        
        const bans = await browser['_PageContainer'].get(ruid)?.evaluate(async () => {
            return await window._getAllBansFromDB(window.gameRoom.config._RUID) || [];
        }) || [];
        
        // Apply pagination if requested
        let result = bans;
        if (start !== undefined && count !== undefined) {
            const startIdx = parseInt(start as string) || 0;
            const countNum = parseInt(count as string) || 10;
            result = bans.slice(startIdx, startIdx + countNum);
        }
        
        ctx.body = result;
        ctx.status = 200;
    } catch (error) {
        console.error('Error fetching bans:', error);
        ctx.status = 500;
        ctx.body = { error: 'Failed to fetch bans', details: error.message };
    }
}

export async function createBan(ctx: Context) {
    const { ruid } = ctx.params;
    const { auth, conn, reason, durationMinutes, adminAuth, adminName, playerName } = ctx.request.body;

    if (!auth || !reason) {
        ctx.status = 400;
        ctx.body = { error: 'Missing required fields' };
        return;
    }

    try {
        const browser = HeadlessBrowser.getInstance();
        if (!browser.checkExistRoom(ruid)) {
            ctx.status = 404;
            ctx.body = { error: 'Room not found' };
            return;
        }
        
        await browser['_PageContainer'].get(ruid)?.evaluate(async (
            auth: string,
            conn: string,
            reason: string,
            durationMinutes: number,
            adminAuth: string,
            adminName: string,
            playerName: string
        ) => {
            await window._createBanDB(
                window.gameRoom.config._RUID,
                auth,
                conn,
                reason,
                durationMinutes,
                adminAuth,
                adminName,
                playerName
            );
        }, auth, conn || '', reason, durationMinutes || 0, adminAuth || 'web-admin', adminName || 'Web Admin', playerName || 'Unknown');
        
        ctx.status = 204;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to create ban' };
    }
}

export async function deleteBan(ctx: Context) {
    const { ruid, auth } = ctx.params;
    
    try {
        const browser = HeadlessBrowser.getInstance();
        if (!browser.checkExistRoom(ruid)) {
            ctx.status = 404;
            ctx.body = { error: 'Room not found' };
            return;
        }
        
        const success = await browser['_PageContainer'].get(ruid)?.evaluate(async (auth: string) => {
            return await window._deleteBanByAuthDB(window.gameRoom.config._RUID, auth);
        }, auth);
        
        if (success) {
            ctx.status = 204;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'Ban not found' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to delete ban' };
    }
}

export async function getAllMutes(ctx: Context) {
    const { ruid } = ctx.params;
    const { start, count } = ctx.request.query;
    
    try {
        const browser = HeadlessBrowser.getInstance();
        if (!browser.checkExistRoom(ruid)) {
            ctx.status = 404;
            ctx.body = { error: 'Room not found' };
            return;
        }
        
        const mutes = await browser['_PageContainer'].get(ruid)?.evaluate(async () => {
            return await window._getAllMutesFromDB(window.gameRoom.config._RUID) || [];
        }) || [];
        
        // Apply pagination if requested
        let result = mutes;
        if (start !== undefined && count !== undefined) {
            const startIdx = parseInt(start as string) || 0;
            const countNum = parseInt(count as string) || 10;
            result = mutes.slice(startIdx, startIdx + countNum);
        }
        
        ctx.body = result;
        ctx.status = 200;
    } catch (error) {
        console.error('Error fetching mutes:', error);
        ctx.status = 500;
        ctx.body = { error: 'Failed to fetch mutes', details: error.message };
    }
}

export async function createMute(ctx: Context) {
    const { ruid } = ctx.params;
    const { auth, conn, reason, durationMinutes, adminAuth, adminName } = ctx.request.body;

    if (!auth || !reason) {
        ctx.status = 400;
        ctx.body = { error: 'Missing required fields' };
        return;
    }

    try {
        const browser = HeadlessBrowser.getInstance();
        if (!browser.checkExistRoom(ruid)) {
            ctx.status = 404;
            ctx.body = { error: 'Room not found' };
            return;
        }
        
        await browser['_PageContainer'].get(ruid)?.evaluate(async (
            auth: string,
            conn: string,
            reason: string,
            durationMinutes: number,
            adminAuth: string,
            adminName: string
        ) => {
            await window._createMuteDB(
                window.gameRoom.config._RUID,
                auth,
                conn,
                reason,
                durationMinutes,
                adminAuth,
                adminName
            );
        }, auth, conn || '', reason, durationMinutes || 0, adminAuth || 'web-admin', adminName || 'Web Admin');
        
        ctx.status = 204;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to create mute' };
    }
}

export async function deleteMute(ctx: Context) {
    const { ruid, auth } = ctx.params;
    
    try {
        const browser = HeadlessBrowser.getInstance();
        if (!browser.checkExistRoom(ruid)) {
            ctx.status = 404;
            ctx.body = { error: 'Room not found' };
            return;
        }
        
        const success = await browser['_PageContainer'].get(ruid)?.evaluate(async (auth: string) => {
            return await window._deleteMuteByAuthDB(window.gameRoom.config._RUID, auth);
        }, auth);
        
        if (success) {
            ctx.status = 204;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'Mute not found' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to delete mute' };
    }
}