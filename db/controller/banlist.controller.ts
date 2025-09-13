import { Context } from "koa";
import { IRepository } from '../repository/repository.interface';
import { BanList } from '../entity/banlist.entity';
import { BanListModel } from '../model/BanListModel';
import { banListModelSchema } from "../model/Validator";

export class BanListController {
    private readonly _repository: IRepository<BanList>;

    constructor(repository: IRepository<BanList>) {
        this._repository = repository;
    }

    public async getAllBannedPlayers(ctx: Context) {
        try {
            const { ruid } = ctx.params;
            const { start, count } = ctx.request.query;

            let players;
            if (start && count) {
                players = await this._repository.findAll(ruid, { 
                    start: parseInt(<string>start), 
                    count: parseInt(<string>count) 
                });
            } else {
                players = await this._repository.findAll(ruid);
            }
            
            ctx.status = 200;
            ctx.body = players || [];
        } catch (error) {
            console.error('Error getting banned players:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error', details: error.message };
        }
    }

    public async getBannedPlayer(ctx: Context) {
        try {
            const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
            const { identifier } = ctx.params;

            if (!identifier) {
                ctx.status = 400;
                ctx.body = { error: 'Identifier is required' };
                return;
            }

            const player = await this._repository.findSingle(ruid, identifier);
            
            if (player) {
                ctx.status = 200;
                ctx.body = player;
            } else {
                ctx.status = 404;
                ctx.body = { error: 'Player not found in ban list' };
            }
        } catch (error) {
            console.error('Error getting banned player:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error', details: error.message };
        }
    }

    public async addBanPlayer(ctx: Context) {
        try {
            const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
            const banlistModel: BanListModel = ctx.request.body;

            if (!banlistModel) {
                ctx.status = 400;
                ctx.body = { error: 'Ban data is required' };
                return;
            }

            await this._repository.addSingle(ruid, banlistModel);
            ctx.status = 204;
        } catch (error) {
            console.error('Error adding ban:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error', details: error.message };
        }
    }

    public async updateBannedPlayer(ctx: Context) {
        try {
            const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
            const { identifier } = ctx.params;
            const banlistModel: BanListModel = ctx.request.body;

            if (!identifier) {
                ctx.status = 400;
                ctx.body = { error: 'Identifier is required' };
                return;
            }

            if (!banlistModel) {
                ctx.status = 400;
                ctx.body = { error: 'Ban data is required' };
                return;
            }

            await this._repository.updateSingle(ruid, identifier, banlistModel);
            ctx.status = 204;
        } catch (error) {
            console.error('Error updating ban:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error', details: error.message };
        }
    }

    public async deleteBannedPlayer(ctx: Context) {
        try {
            const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
            const { identifier } = ctx.params;

            if (!identifier) {
                ctx.status = 400;
                ctx.body = { error: 'Identifier is required' };
                return;
            }

            await this._repository.deleteSingle(ruid, identifier);
            ctx.status = 204;
        } catch (error) {
            console.error('Error deleting ban:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error', details: error.message };
        }
    }
}
