import { Context } from "koa";
import { IRepository } from '../repository/repository.interface';
import { MuteList } from '../entity/mutelist.entity';
import { MuteListModel } from '../model/MuteListModel';

export class MuteListController {
    private readonly _repository: IRepository<MuteList>;

    constructor(repository: IRepository<MuteList>) {
        this._repository = repository;
    }

    public async getAllMutedPlayers(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const { start, count } = ctx.request.query;

        if (start && count) {
            return this._repository
                .findAll(ruid, { start: parseInt(<string>start), count: parseInt(<string>count) })
                .then((players) => {
                    ctx.status = 200;
                    ctx.body = players;
                })
                .catch((error) => {
                    ctx.status = 404;
                    ctx.body = { error: error.message };
                });
        } else {
            return this._repository
                .findAll(ruid)
                .then((players) => {
                    ctx.status = 200;
                    ctx.body = players;
                })
                .catch((error) => {
                    ctx.status = 404;
                    ctx.body = { error: error.message };
                });
        }
    }

    public async getMutedPlayer(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const { identifier } = ctx.params;

        return this._repository
            .findSingle(ruid, identifier)
            .then((player) => {
                ctx.status = 200;
                ctx.body = player;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async addMutePlayer(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const mutelistModel: MuteListModel = ctx.request.body;

        return this._repository
            .addSingle(ruid, mutelistModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 400;
                ctx.body = { error: error.message };
            });
    }

    public async updateMutedPlayer(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const { identifier } = ctx.params;
        const mutelistModel: MuteListModel = ctx.request.body;

        return this._repository
            .updateSingle(ruid, identifier, mutelistModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async deleteMutedPlayer(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const { identifier } = ctx.params;

        return this._repository
            .deleteSingle(ruid, identifier)
            .then(() => {
                ctx.status = 204;
            })
            .catch((error) => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }
}
