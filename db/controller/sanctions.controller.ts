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
            const { ruid, type, auth } = ctx.params;
            const { adminAuth, adminName } = ctx.request.body;
            
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
}