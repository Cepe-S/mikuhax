
import { getRepository, Repository } from 'typeorm';
import { IRepository } from './repository.interface';
import { MatchEvent } from '../entity/match_event.entity';
import { MatchEventModel } from '../model/MatchEventModel';


export class MatchEventRepository implements IRepository<MatchEvent> {
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
            // Buscar evento único por matchId, playerId, timestamp
            const { matchId, playerId, timestamp } = target;
            const event = await repository.findOne({ ruid, matchId, playerId, timestamp });
            if (!event) throw new Error('Match event not found.');
            return event;
        }
    }

    public async addSingle(ruid: string, event: MatchEventModel): Promise<MatchEvent> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let newEvent = await repository.findOne({ ruid, matchId: event.matchId, playerId: event.playerId, timestamp: event.timestamp });
        if (!newEvent) {
            newEvent = repository.create({ ...event, ruid });
        } else {
            throw new Error('Match event already exists.');
        }
        return await repository.save(newEvent);
    }

    public async updateSingle(ruid: string, target: any, event: MatchEventModel): Promise<MatchEvent> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let matchId: string, playerId: number, timestamp: number;
        if (typeof target === 'object') {
            ({ matchId, playerId, timestamp } = target);
        } else {
            throw new Error('Invalid target for updateSingle');
        }
        let existingEvent = await repository.findOne({ ruid: ruid, matchId, playerId, timestamp });
        if (existingEvent) {
            Object.assign(existingEvent, event);
        } else {
            throw new Error('Match event not found.');
        }
        return await repository.save(existingEvent);
    }

    public async deleteSingle(ruid: string, target: any): Promise<void> {
        const repository: Repository<MatchEvent> = getRepository(MatchEvent);
        let matchId: string, playerId: number, timestamp: number;
        if (typeof target === 'object') {
            ({ matchId, playerId, timestamp } = target);
        } else {
            throw new Error('Invalid target for deleteSingle');
        }
        const event = await repository.findOne({ ruid: ruid, matchId, playerId, timestamp });
        if (!event) {
            throw new Error('Match event not found.');
        } else {
            await repository.remove(event);
        }
    }
}
