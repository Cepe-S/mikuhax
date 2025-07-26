
import { getRepository, Repository } from 'typeorm';
import { IRepository } from './repository.interface';
import { MatchSummary } from '../entity/match_summary.entity';
import { MatchSummaryModel } from '../model/MatchSummaryModel';


export class MatchSummaryRepository implements IRepository<MatchSummary> {
    public async findAll(ruid: string, pagination?: {start: number, count: number}): Promise<MatchSummary[]> {
        const repository: Repository<MatchSummary> = getRepository(MatchSummary);
        const options: any = { where: { ruid: ruid } };
        if (pagination && pagination.start !== undefined && pagination.count !== undefined) {
            options.skip = pagination.start;
            options.take = pagination.count;
        }
        const summaries = await repository.find(options);
        if (summaries.length === 0) throw new Error('No match summaries found.');
        return summaries;
    }

    public async findSingle(ruid: string, target: string): Promise<MatchSummary | undefined> {
        const repository: Repository<MatchSummary> = getRepository(MatchSummary);
        const summary = await repository.findOne({ ruid: ruid, matchId: target });
        if (!summary) throw new Error('Match summary not found.');
        return summary;
    }

    public async addSingle(ruid: string, summary: MatchSummaryModel): Promise<MatchSummary> {
        const repository: Repository<MatchSummary> = getRepository(MatchSummary);
        let newSummary = await repository.findOne({ ruid: ruid, matchId: summary.matchId });
        if (!newSummary) {
            newSummary = repository.create({ ...summary, ruid });
        } else {
            throw new Error('Match summary already exists.');
        }
        return await repository.save(newSummary);
    }

    public async updateSingle(ruid: string, target: string, summary: MatchSummaryModel): Promise<MatchSummary> {
        const repository: Repository<MatchSummary> = getRepository(MatchSummary);
        let existingSummary = await repository.findOne({ ruid: ruid, matchId: target });
        if (existingSummary) {
            Object.assign(existingSummary, summary);
        } else {
            throw new Error('Match summary not found.');
        }
        return await repository.save(existingSummary);
    }

    public async deleteSingle(ruid: string, target: string): Promise<void> {
        const repository: Repository<MatchSummary> = getRepository(MatchSummary);
        const summary = await repository.findOne({ ruid: ruid, matchId: target });
        if (!summary) {
            throw new Error('Match summary not found.');
        } else {
            await repository.remove(summary);
        }
    }
}
