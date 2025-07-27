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

    public async getTopScorersGlobal(ctx: Context) {
        const { ruid } = ctx.params;
        if (!this._repository.getTopScorersGlobal) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        return this._repository
            .getTopScorersGlobal(ruid)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getTopScorersMonthly(ctx: Context) {
        const { ruid } = ctx.params;
        if (!this._repository.getTopScorersMonthly) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        return this._repository
            .getTopScorersMonthly(ruid)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getTopScorersDaily(ctx: Context) {
        const { ruid } = ctx.params;
        if (!this._repository.getTopScorersDaily) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        return this._repository
            .getTopScorersDaily(ruid)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getTopAssistersGlobal(ctx: Context) {
        const { ruid } = ctx.params;
        if (!this._repository.getTopAssistersGlobal) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        return this._repository
            .getTopAssistersGlobal(ruid)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getTopAssistersMonthly(ctx: Context) {
        const { ruid } = ctx.params;
        if (!this._repository.getTopAssistersMonthly) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        return this._repository
            .getTopAssistersMonthly(ruid)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getTopAssistersDaily(ctx: Context) {
        const { ruid } = ctx.params;
        if (!this._repository.getTopAssistersDaily) {
            ctx.status = 501;
            ctx.body = { error: 'Method not implemented' };
            return;
        }
        return this._repository
            .getTopAssistersDaily(ruid)
            .then(result => {
                ctx.status = 200;
                ctx.body = result;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }
}