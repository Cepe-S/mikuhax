import { Context } from "koa";
import { SanctionsModel } from "../model/SanctionsModel";
import { SanctionsLogsModel } from "../model/SanctionsLogsModel";

export class SanctionsController {
    private sanctionsModel: SanctionsModel;
    private sanctionsLogsModel: SanctionsLogsModel;

    constructor() {
        this.sanctionsModel = new SanctionsModel();
        this.sanctionsLogsModel = new SanctionsLogsModel();
    }

    async createSanction(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            const { type, auth, conn, reason, register, expire, adminAuth, adminName, playerName } = ctx.request.body;
            
            const sanctionId = await this.sanctionsModel.create({
                ruid, type, auth, conn, reason, register, expire, adminAuth, adminName, playerName
            });

            await this.sanctionsLogsModel.create({
                ruid, sanctionId, type, playerAuth: auth, playerConn: conn, playerName: playerName || '',
                adminAuth: adminAuth || '', adminName: adminName || '', reason, timestamp: Date.now(), expire, wasActive: true
            });

            ctx.status = 201;
            ctx.body = { id: sanctionId };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }

    async checkSanction(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            const { auth, type } = ctx.query;
            
            const sanction = await this.sanctionsModel.findActiveByAuth(ruid, auth as string, type as string);
            if (sanction) {
                ctx.body = sanction;
            } else {
                ctx.status = 404;
                ctx.body = { message: 'Not found' };
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }

    async deleteSanction(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            let { type, auth } = ctx.params;
            const { adminAuth, adminName } = ctx.request.body;
            
            // Handle mute-specific route
            if (!type && ctx.path.includes('/mutes/')) {
                type = 'mute';
            }
            
            const sanction = await this.sanctionsModel.findActiveByAuth(ruid, auth, type);
            if (sanction) {
                await this.sanctionsModel.deactivate(sanction.id);
                
                await this.sanctionsLogsModel.create({
                    ruid, sanctionId: sanction.id, type: `un${type}` as any, 
                    playerAuth: auth, playerConn: sanction.conn, playerName: sanction.playerName || '',
                    adminAuth: adminAuth || '', adminName: adminName || '', 
                    reason: 'Removed', timestamp: Date.now(), expire: 0, wasActive: true
                });
                
                ctx.status = 204;
            } else {
                ctx.status = 404;
                ctx.body = { message: 'Not found' };
            }
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }

    async getSanctions(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            const { type } = ctx.query;
            
            const sanctions = await this.sanctionsModel.findByRuidAndType(ruid, type as string);
            ctx.body = sanctions;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }

    async getBans(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            
            const bans = await this.sanctionsModel.findByRuidAndType(ruid, 'ban');
            ctx.body = bans;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }

    async getMutes(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            const { start = 0, count = 10 } = ctx.query;
            
            const allMutes = await this.sanctionsModel.findByRuidAndType(ruid, 'mute');
            const startIndex = parseInt(start as string);
            const countLimit = parseInt(count as string);
            
            const paginatedMutes = allMutes.slice(startIndex, startIndex + countLimit);
            
            // Format mutes for the frontend
            const formattedMutes = paginatedMutes.map(mute => ({
                auth: mute.auth,
                playerName: mute.playerName || 'Unknown',
                reason: mute.reason,
                createdAt: mute.register,
                expiresAt: mute.expire,
                adminName: mute.adminName || 'System',
                isActive: mute.active && (mute.expire === -1 || mute.expire > Date.now())
            }));
            
            ctx.body = formattedMutes;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }
}