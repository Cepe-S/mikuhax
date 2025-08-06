import { Context } from 'koa';
import { ConnectionRepository } from '../repository/connection.repository';
import { Connection } from '../entity/connection.entity';
import { ConnectionModel } from '../model/ConnectionModel';

const connectionRepository = new ConnectionRepository();

/**
 * Get all connections for a room
 * GET /v1/connections/:ruid
 */
export async function getAllConnections(ctx: Context) {
    const { ruid } = ctx.params;
    const { start, count } = ctx.query;
    
    try {
        let pagination;
        if (start !== undefined && count !== undefined) {
            pagination = { start: parseInt(start as string), count: parseInt(count as string) };
        }
        
        const connections: Connection[] = await connectionRepository.findAll(ruid, pagination);
        ctx.status = 200;
        ctx.body = connections;
    } catch (error) {
        ctx.status = 404;
        ctx.body = { error: error.message };
    }
}

/**
 * Get single connection by conn ID
 * GET /v1/connections/:ruid/:conn
 */
export async function getSingleConnection(ctx: Context) {
    const { ruid, conn } = ctx.params;
    
    try {
        const connection: Connection | undefined = await connectionRepository.findSingle(ruid, conn);
        if (connection) {
            ctx.status = 200;
            ctx.body = connection;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'Connection not found' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}

/**
 * Create new connection record
 * POST /v1/connections/:ruid
 */
export async function createConnection(ctx: Context) {
    const { ruid } = ctx.params;
    
    try {
        const connection: Connection = await connectionRepository.addSingle(ruid, ctx.request.body);
        ctx.status = 201;
        ctx.body = connection;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

/**
 * Update connection record
 * PUT /v1/connections/:ruid/:conn
 */
export async function updateConnection(ctx: Context) {
    const { ruid, conn } = ctx.params;
    
    try {
        const connection: Connection = await connectionRepository.updateSingle(ruid, conn, ctx.request.body);
        ctx.status = 200;
        ctx.body = connection;
    } catch (error) {
        ctx.status = 404;
        ctx.body = { error: error.message };
    }
}

/**
 * Delete connection record
 * DELETE /v1/connections/:ruid/:conn
 */
export async function deleteConnection(ctx: Context) {
    const { ruid, conn } = ctx.params;
    
    try {
        await connectionRepository.deleteSingle(ruid, conn);
        ctx.status = 204;
    } catch (error) {
        ctx.status = 404;
        ctx.body = { error: error.message };
    }
}

/**
 * Get suspicious connections
 * GET /v1/connections/:ruid/suspicious
 */
export async function getSuspiciousConnections(ctx: Context) {
    const { ruid } = ctx.params;
    
    try {
        const connections: Connection[] = await connectionRepository.getSuspiciousConnections(ruid);
        ctx.status = 200;
        ctx.body = connections;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}

/**
 * Mark connection as suspicious
 * PATCH /v1/connections/:ruid/:conn/suspicious
 */
export async function markConnectionSuspicious(ctx: Context) {
    const { ruid, conn } = ctx.params;
    const { isSuspicious = true } = ctx.request.body;
    
    try {
        await connectionRepository.markSuspicious(ruid, conn, isSuspicious);
        ctx.status = 200;
        ctx.body = { message: 'Connection marked as suspicious' };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}

/**
 * Track new connection (for core game integration)
 * POST /api/v1/connections
 */
export async function trackConnection(ctx: Context) {
    try {
        const connectionData = ctx.request.body as {
            auth: string;
            nickname: string;
            ipAddress: string;
            timestamp: number;
            ruid: string;
            eventType: 'join' | 'rejoin' | 'kick' | 'ban';
            country: string;
            city: string;
            isp: string;
        };

        // Convert to your ConnectionModel format with all required fields
        const nickname = connectionData.nickname || 'Unknown Player';
        
        const adaptedData: ConnectionModel = {
            ruid: connectionData.ruid,
            conn: connectionData.ipAddress, // Using IP as conn for now
            auth: connectionData.auth,
            playerName: nickname,
            ipAddress: connectionData.ipAddress,
            country: connectionData.country || '',
            city: connectionData.city || '',
            isp: connectionData.isp || '',
            isVpn: false,
            isSuspicious: false
        };

        const connection: Connection = await connectionRepository.addSingle(connectionData.ruid, adaptedData);
        ctx.status = 201;
        ctx.body = { success: true, data: connection };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, error: error.message };
    }
}

/**
 * Get player analytics (for command integration)
 * GET /api/v1/connections/:auth/analytics
 */
export async function getPlayerAnalytics(ctx: Context) {
    const { auth } = ctx.params;
    
    try {
        // Get all connections for the room and filter by auth
        // Since there's no findByAuth method, we'll get all and filter
        // You might want to add a findByAuth method to the repository later
        const allConnections = await connectionRepository.findAll('default'); // Using 'default' as ruid for now
        const connections = allConnections.filter(c => c.auth === auth);
        
        if (!connections || connections.length === 0) {
            ctx.status = 404;
            ctx.body = { success: false, message: 'Player not found' };
            return;
        }

        // Calculate basic analytics
        const uniqueIPs = new Set(connections.map(c => c.ipAddress)).size;
        const totalConnections = connections.length;
        const latest = connections[connections.length - 1];

        ctx.status = 200;
        ctx.body = {
            success: true,
            data: {
                auth: auth,
                currentNickname: latest.playerName,
                lastIP: latest.ipAddress,
                lastCountry: latest.country || 'Unknown',
                hasMultipleIPs: uniqueIPs > 1,
                isSuspicious: latest.isSuspicious,
                connectionCount: totalConnections,
                uniqueIPs,
                recentConnections: connections.slice(-10).map(c => ({
                    ipAddress: c.ipAddress,
                    nickname: c.playerName,
                    country: c.country || 'Unknown'
                }))
            }
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, error: error.message };
    }
}
