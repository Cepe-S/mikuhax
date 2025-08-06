import { getRepository, Repository } from 'typeorm';
import { IRepository } from './repository.interface';
import { Connection } from '../entity/connection.entity';
import { ConnectionModel, GeolocationData } from '../model/ConnectionModel';

export class ConnectionRepository implements IRepository<Connection> {
    
    public async findAll(ruid: string, pagination?: {start: number, count: number}): Promise<Connection[]> {
        const repository: Repository<Connection> = getRepository(Connection);
        let connections: Connection[] = [];
        
        if(pagination) {
            connections = await repository.find({
                where: {ruid: ruid}, 
                skip: pagination.start, 
                take: pagination.count,
                order: { id: 'DESC' }
            });
        } else {
            connections = await repository.find({ 
                where: {ruid: ruid},
                order: { id: 'DESC' }
            });
        }
        
        if (connections.length === 0) throw new Error('No connections found.');
        return connections;
    }

    public async findSingle(ruid: string, conn: string): Promise<Connection | undefined> {
        const repository: Repository<Connection> = getRepository(Connection);
        let connection: Connection | undefined = await repository.findOne({ ruid: ruid, conn: conn });
        
        return connection; // Don't throw error, allow undefined for new connections
    }

    public async addSingle(ruid: string, connection: ConnectionModel): Promise<Connection> {
        const repository: Repository<Connection> = getRepository(Connection);
        let newConnection: Connection | undefined = await repository.findOne({ ruid: ruid, conn: connection.conn });
        
        if (newConnection === undefined) {
            newConnection = new Connection();
            newConnection.ruid = ruid;
            newConnection.conn = connection.conn;
            newConnection.auth = connection.auth;
            newConnection.playerName = connection.playerName;
            newConnection.ipAddress = connection.ipAddress;
            newConnection.country = connection.country;
            newConnection.city = connection.city;
            newConnection.isp = connection.isp;
            newConnection.isVpn = connection.isVpn;
            newConnection.isSuspicious = connection.isSuspicious;
        } else {
            throw new Error('Connection already tracked.');
        }
        
        const savedConnection = await repository.save(newConnection);
        return savedConnection;
    }

    public async updateSingle(ruid: string, conn: string, connection: ConnectionModel): Promise<Connection> {
        const repository: Repository<Connection> = getRepository(Connection);
        let existingConnection: Connection | undefined = await repository.findOne({ ruid: ruid, conn: conn });
        
        if (existingConnection !== undefined) {
            existingConnection.auth = connection.auth;
            existingConnection.playerName = connection.playerName;
            existingConnection.ipAddress = connection.ipAddress;
            existingConnection.country = connection.country;
            existingConnection.city = connection.city;
            existingConnection.isp = connection.isp;
            existingConnection.isVpn = connection.isVpn;
            existingConnection.isSuspicious = connection.isSuspicious;
        } else {
            throw new Error('Connection not found.');
        }
        
        const savedConnection = await repository.save(existingConnection);
        return savedConnection;
    }

    public async deleteSingle(ruid: string, conn: string): Promise<void> {
        const repository: Repository<Connection> = getRepository(Connection);
        let connection: Connection | undefined = await repository.findOne({ ruid: ruid, conn: conn });
        
        if (connection === undefined) {
            throw new Error('Connection not found.');
        } else {
            await repository.remove(connection);
        }
    }

    // Simplified methods for the new structure
    public async markSuspicious(ruid: string, conn: string, isSuspicious: boolean): Promise<void> {
        const repository: Repository<Connection> = getRepository(Connection);
        await repository.update({ ruid, conn }, { isSuspicious });
    }

    public async getSuspiciousConnections(ruid: string): Promise<Connection[]> {
        const repository: Repository<Connection> = getRepository(Connection);
        return await repository.find({
            where: { ruid, isSuspicious: true },
            order: { id: 'DESC' }
        });
    }
}
