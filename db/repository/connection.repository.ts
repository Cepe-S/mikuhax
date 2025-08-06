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
        
        try {
            console.log('🔍 [Repository] Finding connection:', { ruid, conn });
            // Use the new TypeORM syntax for findOne
            let connection: Connection | undefined = await repository.findOne({
                where: { ruid: ruid, conn: conn }
            });
            
            console.log('🔍 [Repository] Find result:', connection ? 'Found' : 'Not found');
            return connection; // Don't throw error, allow undefined for new connections
        } catch (error) {
            console.error('❌ [Repository] Error in findSingle:', error);
            throw error;
        }
    }

    public async addSingle(ruid: string, connection: ConnectionModel): Promise<Connection> {
        const repository: Repository<Connection> = getRepository(Connection);
        
        try {
            console.log('🔍 [Repository] Checking if connection exists:', { ruid, conn: connection.conn });
            let newConnection: Connection | undefined = await repository.findOne({ 
                where: { ruid: ruid, conn: connection.conn } 
            });
            
            if (newConnection === undefined) {
                console.log('✅ [Repository] Creating new connection');
                newConnection = new Connection();
                newConnection.ruid = ruid;
                newConnection.conn = connection.conn;
                newConnection.auth = connection.auth;
                newConnection.playerName = connection.playerName;
                newConnection.ipAddress = connection.ipAddress;
                newConnection.country = connection.country;
                newConnection.region = connection.region;
                newConnection.city = connection.city;
                newConnection.latitude = connection.latitude;
                newConnection.longitude = connection.longitude;
                newConnection.isp = connection.isp;
                newConnection.timezone = connection.timezone;
                newConnection.isVpn = connection.isVpn || false;
                newConnection.isSuspicious = connection.isSuspicious || false;
                newConnection.spamScore = connection.spamScore || 0;
                newConnection.joinCount = connection.joinCount || 1;
                newConnection.kickCount = connection.kickCount || 0;
                newConnection.banCount = connection.banCount || 0;
                newConnection.aliases = connection.aliases;
                newConnection.spamPatterns = connection.spamPatterns;
                newConnection.firstSeen = connection.firstSeen || new Date();
                newConnection.lastSeen = connection.lastSeen || new Date();
                newConnection.lastActivity = connection.lastActivity || new Date();
                
                console.log('💾 [Repository] Saving new connection to database');
                const savedConnection = await repository.save(newConnection);
                console.log('✅ [Repository] Connection saved successfully');
                return savedConnection;
            } else {
                console.log('❌ [Repository] Connection already exists, throwing error');
                throw new Error('Connection already tracked.');
            }
        } catch (error) {
            console.error('❌ [Repository] Error in addSingle:', error);
            throw error;
        }
    }

    public async updateSingle(ruid: string, conn: string, connection: ConnectionModel): Promise<Connection> {
        const repository: Repository<Connection> = getRepository(Connection);
        let existingConnection: Connection | undefined = await repository.findOne({ ruid: ruid, conn: conn });
        
        if (existingConnection !== undefined) {
            existingConnection.auth = connection.auth;
            existingConnection.playerName = connection.playerName;
            existingConnection.ipAddress = connection.ipAddress;
            existingConnection.country = connection.country;
            existingConnection.region = connection.region;
            existingConnection.city = connection.city;
            existingConnection.latitude = connection.latitude;
            existingConnection.longitude = connection.longitude;
            existingConnection.isp = connection.isp;
            existingConnection.timezone = connection.timezone;
            existingConnection.isVpn = connection.isVpn || false;
            existingConnection.isSuspicious = connection.isSuspicious || false;
            existingConnection.spamScore = connection.spamScore || existingConnection.spamScore;
            existingConnection.joinCount = connection.joinCount || existingConnection.joinCount;
            existingConnection.kickCount = connection.kickCount || existingConnection.kickCount;
            existingConnection.banCount = connection.banCount || existingConnection.banCount;
            existingConnection.aliases = connection.aliases || existingConnection.aliases;
            existingConnection.spamPatterns = connection.spamPatterns || existingConnection.spamPatterns;
            existingConnection.lastSeen = connection.lastSeen || new Date();
            existingConnection.lastActivity = connection.lastActivity || new Date();
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
