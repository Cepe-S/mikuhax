import { Context } from "koa";
import { MatchEvent } from '../entity/match_event.entity';
import { MatchEventModel } from '../model/MatchEventModel';
import { IRepository } from '../repository/repository.interface';

export class MatchEventController {
    private readonly _repository: IRepository<MatchEvent>;

    constructor(repository: IRepository<MatchEvent>) {
        this._repository = repository;
    }

    public async getAllMatchEvents(ctx: Context) {
        const { ruid } = ctx.params;
        return this._repository
            .findAll(ruid)
            .then(events => {
                ctx.status = 200;
                ctx.body = events;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getMatchEvent(ctx: Context) {
        const { ruid, matchId } = ctx.params;
        return this._repository
            .findSingle(ruid, matchId)
            .then(event => {
                ctx.status = 200;
                ctx.body = event;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async addMatchEvent(ctx: Context) {
        const { ruid } = ctx.params;
        const matchEventModel: MatchEventModel = ctx.request.body;
        return this._repository
            .addSingle(ruid, matchEventModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch(error => {
                ctx.status = 400;
                ctx.body = { error: error.message };
            });
    }
}