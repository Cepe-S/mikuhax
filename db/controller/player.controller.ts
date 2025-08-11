import { Context } from "koa";
import { IRepository } from '../repository/repository.interface';
import { Player } from '../entity/player.entity';
import { PlayerModel } from '../model/PlayerModel';
import { playerModelSchema } from "../model/Validator";

export class PlayerController {
    private readonly _repository: IRepository<Player>;

    constructor(repository: IRepository<Player>) {
        this._repository = repository;
    }

    public async getAllPlayers(ctx: Context) {
        const { ruid } = ctx.params;
        const { start, count, orderBy, order } = ctx.request.query;

        const options: any = {};
        
        if (start && count) {
            options.start = parseInt(<string>start);
            options.count = parseInt(<string>count);
        }
        
        if (orderBy) {
            options.orderBy = <string>orderBy;
            options.order = order || 'DESC';
        }

        return this._repository
            .findAll(ruid, options)
            .then((players) => {
                ctx.status = 200;
                ctx.body = players;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getTop20Players(ctx: Context) {
        const { ruid } = ctx.params;

        try {
            // Get all players first, then sort and limit to top 20
            const allPlayers = await this._repository.findAll(ruid);
            
            // Sort by rating descending and take top 20
            const sortedPlayers = allPlayers
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 20);
            
            // Transform to TOP 20 format
            const top20 = sortedPlayers.map((player: any, index: number) => ({
                playerAuth: player.auth,
                playerName: player.name,
                rating: player.rating || 0,
                rank: index + 1
            }));
            
            ctx.status = 200;
            ctx.body = top20;
        } catch (error) {
            ctx.status = 404;
            ctx.body = { error: error.message };
        }
    }

    public async getPlayer(ctx: Context) {
        const { ruid, auth } = ctx.params;

        return this._repository
            .findSingle(ruid, auth)
            .then((player) => {
                ctx.status = 200;
                ctx.body = player;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async addPlayer(ctx: Context) {
        const validationResult = playerModelSchema.validate(ctx.request.body);

        if (validationResult.error) {
            ctx.status = 400;
            ctx.body = validationResult.error;
            return;
        }

        const { ruid } = ctx.params;
        const playerModel: PlayerModel = ctx.request.body;

        return this._repository
            .addSingle(ruid, playerModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 400;
                ctx.body = { error: error.message };
            });
    }

    public async updatePlayer(ctx: Context) {
        const validationResult = playerModelSchema.validate(ctx.request.body);

        if (validationResult.error) {
            ctx.status = 400;
            ctx.body = validationResult.error;
            return;
        }

        const { ruid, auth } = ctx.params;
        const playerModel: PlayerModel = ctx.request.body;

        return this._repository
            .updateSingle(ruid, auth, playerModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async deletePlayer(ctx: Context) {
        const { ruid, auth } = ctx.params;

        return this._repository
            .deleteSingle(ruid, auth)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }
}