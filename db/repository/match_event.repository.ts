
import { getRepository, Repository } from 'typeorm';
import { IRepository, IMatchEventRepository } from './repository.interface';
import { MatchEvent } from '../entity/match_event.entity';
import { MatchEventModel } from '../model/MatchEventModel';
import { Player } from '../entity/player.entity';


export class MatchEventRepository implements IMatchEventRepository<MatchEvent> {
    public async findAll(ruid: string, paginationOrMatchId?: any): Promise<MatchEvent[]> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        // Si se pasa un string, es matchId (compatibilidad vieja)
        if (typeof paginationOrMatchId === 'string') {
            const events = await repository.find({ ruid: ruid, matchId: paginationOrMatchId });
            if (events.length === 0) throw new Error('No match events found.');
            return events;
        }
        // Si se pasa paginación, devolver todos los eventos (sin filtrar por matchId)
        const options: any = { where: { ruid: ruid } };
        if (paginationOrMatchId && paginationOrMatchId.start !== undefined && paginationOrMatchId.count !== undefined) {
            options.skip = paginationOrMatchId.start;
            options.take = paginationOrMatchId.count;
        }
        const events = await repository.find(options);
        if (events.length === 0) throw new Error('No match events found.');
        return events;
    }

    public async findSingle(ruid: string, target: any): Promise<MatchEvent | undefined> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        // target puede ser string (matchId) o un objeto con más info
        if (typeof target === 'string') {
            // Buscar todos los eventos de un matchId
            const events = await repository.find({ ruid: ruid, matchId: target });
            if (events.length === 0) throw new Error('Match event not found.');
            return events[0];
        } else {
            // Buscar evento único por matchId, playerAuth, timestamp
            const { matchId, playerAuth, timestamp } = target;
            const event = await repository.findOne({ ruid, matchId, playerAuth, timestamp });
            if (!event) throw new Error('Match event not found.');
            return event;
        }
    }

    public async addSingle(ruid: string, event: MatchEventModel): Promise<MatchEvent> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let newEvent = await repository.findOne({ ruid, matchId: event.matchId, playerAuth: event.playerAuth, timestamp: event.timestamp });
        if (!newEvent) {
            newEvent = repository.create({ ...event, ruid });
        } else {
            throw new Error('Match event already exists.');
        }
        return await repository.save(newEvent);
    }

    public async updateSingle(ruid: string, target: any, event: MatchEventModel): Promise<MatchEvent> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let matchId: string, playerAuth: string, timestamp: number;
        if (typeof target === 'object') {
            ({ matchId, playerAuth, timestamp } = target);
        } else {
            throw new Error('Invalid target for updateSingle');
        }
        let existingEvent = await repository.findOne({ ruid: ruid, matchId, playerAuth, timestamp });
        if (existingEvent) {
            Object.assign(existingEvent, event);
        } else {
            throw new Error('Match event not found.');
        }
        return await repository.save(existingEvent);
    }

    public async deleteSingle(ruid: string, target: any): Promise<void> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let matchId: string, playerAuth: string, timestamp: number;
        if (typeof target === 'object') {
            ({ matchId, playerAuth, timestamp } = target);
        } else {
            throw new Error('Invalid target for deleteSingle');
        }
        const event = await repository.findOne({ ruid: ruid, matchId, playerAuth, timestamp });
        if (!event) {
            throw new Error('Match event not found.');
        } else {
            await repository.remove(event);
        }
    }

    public async getTopByRange(
        ruid: string,
        eventType: 'goal' | 'assist',
        from?: number,
        to?: number,
        limit: number = 5
    ): Promise<{playerAuth: string, playerName: string, count: number}[]> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let qb = repository
            .createQueryBuilder('event')
            .select('event.playerAuth', 'playerAuth')
            .addSelect('COUNT(*)', 'count')
            .where('event.ruid = :ruid', { ruid })
            .andWhere('event.eventType = :eventType', { eventType });

        if (from !== undefined && to !== undefined) {
            qb = qb.andWhere('event.timestamp BETWEEN :from AND :to', { from, to });
        } else if (from !== undefined) {
            qb = qb.andWhere('event.timestamp >= :from', { from });
        } else if (to !== undefined) {
            qb = qb.andWhere('event.timestamp <= :to', { to });
        }

        const result = await qb
            .groupBy('event.playerAuth')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        const playerRepository = getRepository(Player);
        for (let i = 0; i < result.length; i++) {
            const latestPlayer = await playerRepository
                .createQueryBuilder('player')
                .select('player.name', 'name')
                .where('player.ruid = :ruid', { ruid })
                .andWhere('player.auth = :auth', { auth: result[i].playerAuth })
                .orderBy('player.uid', 'DESC')
                .limit(1)
                .getRawOne();

            result[i].playerName = latestPlayer ? latestPlayer.name : `Player #${result[i].playerAuth}`;
        }

        return result.map(r => ({ playerAuth: r.playerAuth, playerName: r.playerName, count: parseInt(r.count) }));
    }
}

export default MatchEventRepository;
