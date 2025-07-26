import { Context } from "koa";
import { MatchSummary } from '../entity/match_summary.entity';
import { MatchSummaryModel } from '../model/MatchSummaryModel';
import { IRepository } from '../repository/repository.interface';

export class MatchSummaryController {
    private readonly _repository: IRepository<MatchSummary>;

    constructor(repository: IRepository<MatchSummary>) {
        this._repository = repository;
    }

    public async getAllMatchSummaries(ctx: Context) {
        const { ruid } = ctx.params;
        return this._repository
            .findAll(ruid)
            .then(summaries => {
                ctx.status = 200;
                ctx.body = summaries;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async getMatchSummary(ctx: Context) {
        const { ruid, matchId } = ctx.params;
        return this._repository
            .findSingle(ruid, matchId)
            .then(summary => {
                ctx.status = 200;
                ctx.body = summary;
            })
            .catch(error => {
                ctx.status = 404;
                ctx.body = { error: error.message };
            });
    }

    public async addMatchSummary(ctx: Context) {
        const { ruid } = ctx.params;
        const matchSummaryModel: MatchSummaryModel = ctx.request.body;
        return this._repository
            .addSingle(ruid, matchSummaryModel)
            .then(() => {
                ctx.status = 204;
            })
            .catch(error => {
                ctx.status = 400;
                ctx.body = { error: error.message };
            });
    }
}