import { getRepository, Repository } from 'typeorm';
import { IRepository } from './repository.interface';
import { MuteList } from '../entity/mutelist.entity';
import { MuteListModel } from '../model/MuteListModel';

export class MuteListRepository implements IRepository<MuteList> {
    public async findAll(ruid: string, pagination?: {start: number, count: number}): Promise<MuteList[]> {
        const repository: Repository<MuteList> = getRepository(MuteList);
        let mutelist: MuteList[] = [];
        if(pagination) {
            mutelist = await repository.find({where: {ruid: ruid}, skip: pagination.start, take: pagination.count});
        } else {
            mutelist = await repository.find({ ruid: ruid });
        }
        if (mutelist.length === 0) throw new Error('There are no muted players.');
        return mutelist;
    }

    public async findSingle(ruid: string, identifier: string): Promise<MuteList | undefined> {
        const repository: Repository<MuteList> = getRepository(MuteList);
        // Try to find by auth first, then by conn
        let mutePlayer: MuteList | undefined = await repository.findOne({ 
            where: [
                { ruid: ruid, auth: identifier },
                { ruid: ruid, conn: identifier }
            ]
        });
        if (mutePlayer === undefined) throw new Error('Such player is not muted.');
        return mutePlayer;
    }

    public async findByAuth(ruid: string, auth: string): Promise<MuteList | undefined> {
        const repository: Repository<MuteList> = getRepository(MuteList);
        return await repository.findOne({ ruid: ruid, auth: auth });
    }

    public async addSingle(ruid: string, mutelist: MuteListModel): Promise<MuteList> {
        const repository: Repository<MuteList> = getRepository(MuteList);
        // Try to find existing mute by auth if provided, otherwise by conn
        let newMute: MuteList | undefined;
        if (mutelist.auth) {
            newMute = await repository.findOne({ ruid: ruid, auth: mutelist.auth });
        }
        if (!newMute) {
            newMute = await repository.findOne({ ruid: ruid, conn: mutelist.conn });
        }
        
        if (newMute === undefined) {
            newMute = new MuteList();
            newMute.ruid = ruid;
            newMute.auth = mutelist.auth;
            newMute.conn = mutelist.conn;
            newMute.reason = mutelist.reason;
            newMute.register = mutelist.register;
            newMute.expire = mutelist.expire;
            newMute.adminAuth = mutelist.adminAuth;
            newMute.adminName = mutelist.adminName;
        } else {
            // Update existing mute
            newMute.conn = mutelist.conn;
            newMute.reason = mutelist.reason;
            newMute.register = mutelist.register;
            newMute.expire = mutelist.expire;
            newMute.adminAuth = mutelist.adminAuth;
            newMute.adminName = mutelist.adminName;
        }
        return await repository.save(newMute);
    }

    public async updateSingle(ruid: string, identifier: string, mutelist: MuteListModel): Promise<MuteList> {
        const repository: Repository<MuteList> = getRepository(MuteList);
        let newMute: MuteList | undefined = await repository.findOne({ 
            where: [
                { ruid: ruid, auth: identifier },
                { ruid: ruid, conn: identifier }
            ]
        });
        if (newMute !== undefined) {
            newMute.auth = mutelist.auth;
            newMute.conn = mutelist.conn;
            newMute.reason = mutelist.reason;
            newMute.register = mutelist.register;
            newMute.expire = mutelist.expire;
            newMute.adminAuth = mutelist.adminAuth;
            newMute.adminName = mutelist.adminName;
        } else {
            throw new Error('Such player is not muted yet.');
        }
        return await repository.save(newMute);
    }

    public async deleteSingle(ruid: string, identifier: string): Promise<void> {
        const repository: Repository<MuteList> = getRepository(MuteList);
        let mutePlayer: MuteList | undefined = await repository.findOne({ 
            where: [
                { ruid: ruid, auth: identifier },
                { ruid: ruid, conn: identifier }
            ]
        });
        if (mutePlayer === undefined) {
            throw new Error('Such player is not muted yet.');
        } else {
            await repository.remove(mutePlayer);
        }
    }
}
