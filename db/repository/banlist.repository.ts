import { getRepository, Repository } from 'typeorm';
import { IRepository } from './repository.interface';
import { BanList } from '../entity/banlist.entity';
import { BanListModel } from '../model/BanListModel';

export class BanListRepository implements IRepository<BanList> {
    public async findAll(ruid: string, pagination?: {start: number, count: number}): Promise<BanList[]> {
        const repository: Repository<BanList> = getRepository(BanList);
        let banlist: BanList[] = [];
        if(pagination) {
            banlist = await repository.find({where: {ruid: ruid}, skip: pagination.start, take: pagination.count});
        } else {
            banlist = await repository.find({ ruid: ruid });
        }
        if (banlist.length === 0) throw new Error('There are no banned players.');
        return banlist;
    }

    public async findSingle(ruid: string, identifier: string): Promise<BanList | undefined> {
        const repository: Repository<BanList> = getRepository(BanList);
        // Try to find by auth first, then by conn
        let banPlayer: BanList | undefined = await repository.findOne({ 
            where: [
                { ruid: ruid, auth: identifier },
                { ruid: ruid, conn: identifier }
            ]
        });
        if (banPlayer === undefined) throw new Error('Such player is not banned.');
        return banPlayer;
    }

    public async findByAuth(ruid: string, auth: string): Promise<BanList | undefined> {
        const repository: Repository<BanList> = getRepository(BanList);
        return await repository.findOne({ ruid: ruid, auth: auth });
    }

    public async addSingle(ruid: string, banlist: BanListModel): Promise<BanList> {
        const repository: Repository<BanList> = getRepository(BanList);
        // Try to find existing ban by auth if provided, otherwise by conn
        let newBan: BanList | undefined;
        if (banlist.auth) {
            newBan = await repository.findOne({ ruid: ruid, auth: banlist.auth });
        }
        if (!newBan) {
            newBan = await repository.findOne({ ruid: ruid, conn: banlist.conn });
        }
        
        if (newBan === undefined) {
            newBan = new BanList();
            newBan.ruid = ruid;
            newBan.auth = banlist.auth;
            newBan.conn = banlist.conn;
            newBan.reason = banlist.reason;
            newBan.register = banlist.register;
            newBan.expire = banlist.expire;
            newBan.adminAuth = banlist.adminAuth;
            newBan.adminName = banlist.adminName;
        } else {
            // Update existing ban
            newBan.conn = banlist.conn;
            newBan.reason = banlist.reason;
            newBan.register = banlist.register;
            newBan.expire = banlist.expire;
            newBan.adminAuth = banlist.adminAuth;
            newBan.adminName = banlist.adminName;
        }
        return await repository.save(newBan);
    }

    public async updateSingle(ruid: string, identifier: string, banlist: BanListModel): Promise<BanList> {
        const repository: Repository<BanList> = getRepository(BanList);
        let newBan: BanList | undefined = await repository.findOne({ 
            where: [
                { ruid: ruid, auth: identifier },
                { ruid: ruid, conn: identifier }
            ]
        });
        if (newBan !== undefined) {
            newBan.auth = banlist.auth;
            newBan.conn = banlist.conn;
            newBan.reason = banlist.reason;
            newBan.register = banlist.register;
            newBan.expire = banlist.expire;
            newBan.adminAuth = banlist.adminAuth;
            newBan.adminName = banlist.adminName;
        } else {
            throw new Error('Such player is not banned yet.');
        }
        return await repository.save(newBan);
    }

    public async deleteSingle(ruid: string, identifier: string): Promise<void> {
        const repository: Repository<BanList> = getRepository(BanList);
        let banPlayer: BanList | undefined = await repository.findOne({ 
            where: [
                { ruid: ruid, auth: identifier },
                { ruid: ruid, conn: identifier }
            ]
        });
        if (banPlayer === undefined) {
            throw new Error('Such player is not banned yet.');
        } else {
            await repository.remove(banPlayer);
        }
    }
}
