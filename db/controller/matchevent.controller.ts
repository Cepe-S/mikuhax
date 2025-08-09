import { Context } from "koa";
import { MatchEvent } from '../entity/match_event.entity';
import { MatchEventModel } from '../model/MatchEventModel';
import { IMatchEventRepository } from '../repository/repository.interface';

export class MatchEventController {
    private readonly _repository: IMatchEventRepository<MatchEvent>;

    constructor(repository: IMatchEventRepository<MatchEvent>) {
        this._repository = repository;
    }

    public async getAllMatchEvents(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
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
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const { matchId } = ctx.params;
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
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
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

    public async getTopByRange(ctx: Context) {
        const ruid: string = (ctx.params as any).ruid || (ctx.state as any).ruid;
        const { type, from, to, limit } = ctx.query;
        if (!this._repository.getTopByRange) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        const eventType = (type as string) === 'assist' ? 'assist' : 'goal';
        const fromNum = from !== undefined ? Number(from) : undefined;
        const toNum = to !== undefined ? Number(to) : undefined;
        const limitNum = limit !== undefined ? Number(limit) : undefined;
        if ((from !== undefined && !Number.isFinite(fromNum!)) || (to !== undefined && !Number.isFinite(toNum!)) || (limit !== undefined && !Number.isFinite(limitNum!))) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid query parameters' };
            return;
        }
        return this._repository
            .getTopByRange(ruid, eventType, fromNum, toNum, limitNum)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }


    // Legacy compatibility handlers can be removed after clients migrate

    // Removed legacy getTopScorersByRange/getTopAssistersByRange
}