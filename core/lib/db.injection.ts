
import "dotenv/config";
import axios from "axios";
import { PlayerStorage } from "../game/model/GameObject/PlayerObject";
import { winstonLogger } from "../winstonLoggerSystem";
import { BanList, SanctionItem } from "../game/model/PlayerBan/BanList";
import { MatchEvent } from "../game/model/GameObject/MatchEvent";
import { MatchSummary } from "../game/model/GameObject/MatchSummary";

// These functions will be injected into bot script on puppeteer


const dbConnAddr: string = (
    'http://'
    + ((process.env.SERVER_CONN_DB_HOST) ? (process.env.SERVER_CONN_DB_HOST) : ('127.0.0.1'))
    + ':'
    + ((process.env.SERVER_CONN_DB_PORT) ? (process.env.SERVER_CONN_DB_PORT) : ('13001'))
    + '/'
    + 'api/'
    + ((process.env.SERVER_CONN_DB_APIVER) ? (process.env.SERVER_CONN_DB_APIVER) : ('v1'))
    + '/'
);

export async function createSuperadminDB(ruid: string, key: string, description: string): Promise<void> {
    try {
        const post = `${dbConnAddr}room/${ruid}/superadmin`;
        winstonLogger.info(`POST to ${post} with key: ${key}, description: ${description}`);
        const result = await axios.post(post, { key: key, description: description });
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createSuperadminDB: Created. key(${key})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 400) {
            winstonLogger.info(`${err.response.status} Failed on createSuperadminDB: Already exist. key(${key})`);
        } else {
            winstonLogger.error(`Error caught on createSuperadminDB: ${error}`);
        }
    }
}

export async function readSuperadminDB(ruid: string, key: string): Promise<string | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/superadmin/${key}`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on readSuperadminDB: Read. key(${key})`);
            return result.data.description;
        }
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on readSuperadminDB: No exist. key(${key})`);
        } else {
            winstonLogger.error(`Error caught on readSuperadminDB: ${error}`);
        }
    }
}

export async function getAllSuperadminsDB(ruid: string): Promise<{key: string, description: string}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/superadmin`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getAllSuperadminsDB: Read ${result.data.length} superadmins`);
            return result.data.map((admin: any) => ({
                key: admin.key,
                description: admin.description
            }));
        }
        return [];
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} No superadmins found for ruid: ${ruid}`);
        } else {
            winstonLogger.error(`Error caught on getAllSuperadminsDB: ${error}`);
        }
        return [];
    }
}

//async function updateSuperadminDB is not implemented.

export async function deleteSuperadminDB(ruid: string, key: string): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/superadmin/${key}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deleteSuperadminDB: Deleted. key(${key})`);
        }
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on deleteSuperadminDB: No exist. key(${key})`);
        } else {
            winstonLogger.error(`Error caught on deleteSuperadminDB: ${error}`);
        }
    }
}

// Sanctions system - Ban functions
export async function createBanDB(ruid: string, auth: string, conn: string, reason: string, durationMinutes: number, adminAuth?: string, adminName?: string, playerName?: string): Promise<void> {
    try {
        const now = Date.now();
        const expire = durationMinutes > 0 ? now + (durationMinutes * 60 * 1000) : -1;
        
        const banData = {
            type: 'ban',
            auth,
            conn,
            reason,
            register: now,
            expire,
            adminAuth,
            adminName,
            playerName
        };
        
        const result = await axios.post(`${dbConnAddr}room/${ruid}/sanctions`, banData);
        if (result.status === 201) {
            winstonLogger.info(`Ban created: auth(${auth}) duration(${durationMinutes}min) reason(${reason})`);
        }
    } catch(error) {
        winstonLogger.error(`Error creating ban: ${error}`);
    }
}

export async function readBanByAuthDB(ruid: string, auth: string): Promise<SanctionItem | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/sanctions/check?auth=${auth}&type=ban`);
        if (result.status === 200 && result.data) {
            return result.data;
        }
    } catch (error) {
        // Not banned - normal
    }
    return undefined;
}

export async function deleteBanByAuthDB(ruid: string, auth: string): Promise<boolean> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/sanctions/ban/${auth}`);
        if (result.status === 204) {
            winstonLogger.info(`Ban removed for auth(${auth})`);
            return true;
        }
    } catch (error) {
        winstonLogger.error(`Error removing ban: ${error}`);
    }
    return false;
}

export async function createPlayerDB(ruid: string, player: PlayerStorage): Promise<void> {
    try {
        const post = `${dbConnAddr}room/${ruid}/player`;
        const result = await axios.post(post, player);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createPlayerDB: Created. auth(${player.auth})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 400) {
            winstonLogger.info(`${err.response.status} Failed on createPlayerDB: Already exist. auth(${player.auth})`);
        } else {
            winstonLogger.error(`Error caught on createPlayerDB: ${error}`);
        }
    }
}

export async function readPlayerDB(ruid: string, playerAuth: string): Promise<PlayerStorage | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/player/${playerAuth}`);
        if (result.status === 200 && result.data) {
            const player: PlayerStorage = {
                auth: result.data.auth,
                conn: result.data.conn,
                name: result.data.name,
                rating: result.data.rating,
                totals: result.data.totals,
                disconns: result.data.disconns,
                wins: result.data.wins,
                goals: result.data.goals,
                assists: result.data.assists,
                ogs: result.data.ogs,
                losePoints: result.data.losePoints,
                balltouch: result.data.balltouch,
                passed: result.data.passed,
                mute: result.data.mute,
                muteExpire: result.data.muteExpire,
                rejoinCount: result.data.rejoinCount,
                joinDate: result.data.joinDate,
                leftDate: result.data.leftDate,
                malActCount: result.data.malActCount
            }
            winstonLogger.info(`${result.status} Succeed on readPlayerDB: Read. auth(${playerAuth})`);
            return player;
        }
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on readPlayerDB: No exist. auth(${playerAuth})`);
        } else {
            winstonLogger.error(`Error caught on readPlayerDB: ${error}`);
        }
    }
}

export async function updatePlayerDB(ruid: string, player: PlayerStorage): Promise<void> {
    try {
        const post = `${dbConnAddr}room/${ruid}/player/${player.auth}`;
        const result = await axios.put(`${dbConnAddr}room/${ruid}/player/${player.auth}`, player);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on updatePlayerDB: Updated. auth(${player.auth})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on updatePlayerDB: No exist. auth(${player.auth})`);
        } else {
            winstonLogger.error(`Error caught on updatePlayerDB: ${error}`);
        }
    }
}

export async function deletePlayerDB(ruid: string, playerAuth: string): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/player/${playerAuth}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deletePlayerDB: Deleted. auth(${playerAuth})`);
        }
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on deletePlayerDB: No exist. auth(${playerAuth})`);
        } else {
            winstonLogger.error(`Error caught on deletePlayerDB: ${error}`);
        }
    }
}

// Crear evento de partido (match_event)
export async function createMatchEventDB(ruid: string, matchEvent: MatchEvent): Promise<void> {
    try {
        const post = `${dbConnAddr}room/${ruid}/match_event`;
        const result = await axios.post(post, matchEvent);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createMatchEventDB: Created. matchId(${matchEvent.matchId})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 400) {
            winstonLogger.info(`${err.response.status} Failed on createMatchEventDB: Already exist. matchId(${matchEvent.matchId})`);
        } else {
            winstonLogger.error(`Error caught on createMatchEventDB: ${error}`);
        }
    }
}

export async function createMatchSummaryDB(ruid: string, matchSummary: MatchSummary): Promise<void> {
    try {
        const post = `${dbConnAddr}room/${ruid}/match_summary`
        const result = await axios.post(post, matchSummary);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createMatchSummaryDB: Created. matchId(${matchSummary.matchId})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 400) {
            winstonLogger.info(`${err.response.status} Failed on createMatchSummaryDB: Already exist. matchId(${matchSummary.matchId})`);
        } else {
            winstonLogger.error(`Error caught on createMatchSummaryDB: ${error}`);
        }
    }
}

// Unified Top endpoint
async function getTopGenericDB(
    ruid: string,
    type: 'goal' | 'assist',
    params?: { from?: number; to?: number; limit?: number }
): Promise<{playerAuth: string, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top`, { params: { type, ...params } });
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopGenericDB(${type})`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopGenericDB(${type}): ${error}`);
        return [];
    }
}

export async function getTopByRangeDB(
    ruid: string,
    type: 'goal' | 'assist',
    from?: number,
    to?: number,
    limit?: number
): Promise<{playerAuth: string, playerName: string, count: number}[]> {
    return getTopGenericDB(ruid, type, { from, to, limit });
}

// Get all players from database
export async function getAllPlayersFromDB(ruid: string): Promise<PlayerStorage[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/player`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getAllPlayersFromDB`);
            return result.data.map((data: any) => ({
                auth: data.auth,
                conn: data.conn,
                name: data.name,
                rating: data.rating,
                totals: data.totals,
                disconns: data.disconns,
                wins: data.wins,
                goals: data.goals,
                assists: data.assists,
                ogs: data.ogs,
                losePoints: data.losePoints,
                balltouch: data.balltouch,
                passed: data.passed,
                mute: data.mute,
                muteExpire: data.muteExpire,
                rejoinCount: data.rejoinCount,
                joinDate: data.joinDate,
                leftDate: data.leftDate,
                malActCount: data.malActCount
            }));
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getAllPlayersFromDB: ${error}`);
        return [];
    }
}

// Connection tracking functions
export async function trackConnectionDB(connectionData: {
    auth: string;
    nickname: string;
    ipAddress: string;
    timestamp: number;
    ruid: string;
    eventType: 'join' | 'rejoin' | 'kick' | 'ban';
    country: string;
    city: string;
    isp: string;
}): Promise<void> {
    try {
        // Send data to the new trackConnection endpoint
        const result = await axios.post(`${dbConnAddr}connections`, connectionData);
        if (result.status === 201) {
            winstonLogger.info(`201 Succeed on trackConnectionDB: Created. auth(${connectionData.auth})`);
        }
    } catch (error) {
        winstonLogger.error(`Error caught on trackConnectionDB: ${error}`);
    }
}

export async function getConnectionAnalyticsDB(auth: string): Promise<any> {
    try {
        // For now, just return null since the analytics endpoint is not implemented in your controller
        // You can implement this later when you add the analytics functionality
        winstonLogger.info(`Analytics not implemented for auth(${auth})`);
        return null;
    } catch (error) {
        const err = error as any;
        winstonLogger.error(`Error caught on getConnectionAnalyticsDB: ${error}`);
        return null;
    }
}

// Removed legacy top-scorers/top-assisters endpoints and fallbacks

// ================== NEW AUTH-BASED BAN/MUTE SYSTEM ==================

// Mute functions
export async function createMuteDB(ruid: string, auth: string, conn: string, reason: string, durationMinutes: number, adminAuth?: string, adminName?: string, playerName?: string): Promise<void> {
    try {
        const now = Date.now();
        const expire = durationMinutes > 0 ? now + (durationMinutes * 60 * 1000) : -1;
        
        const muteData = {
            type: 'mute',
            auth,
            conn,
            reason,
            register: now,
            expire,
            adminAuth,
            adminName,
            playerName
        };
        
        const result = await axios.post(`${dbConnAddr}room/${ruid}/sanctions`, muteData);
        if (result.status === 201) {
            winstonLogger.info(`Mute created: auth(${auth}) duration(${durationMinutes}min) reason(${reason})`);
        }
    } catch(error) {
        winstonLogger.error(`Error creating mute: ${error}`);
    }
}

export async function readMuteByAuthDB(ruid: string, auth: string): Promise<SanctionItem | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/sanctions/check?auth=${auth}&type=mute`);
        if (result.status === 200 && result.data) {
            return result.data;
        }
    } catch (error) {
        // Not muted - normal
    }
    return undefined;
}

export async function deleteMuteByAuthDB(ruid: string, auth: string): Promise<boolean> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/sanctions/mute/${auth}`);
        if (result.status === 204) {
            winstonLogger.info(`Mute removed for auth(${auth})`);
            return true;
        }
    } catch (error) {
        winstonLogger.error(`Error removing mute: ${error}`);
    }
    return false;
}

// Get all sanctions from database
export async function getAllBansFromDB(ruid: string): Promise<SanctionItem[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/sanctions?type=ban`);
        if (result.status === 200 && result.data) {
            return result.data;
        }
        return [];
    } catch (error) {
        return [];
    }
}

export async function getAllMutesFromDB(ruid: string): Promise<SanctionItem[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/sanctions?type=mute`);
        if (result.status === 200 && result.data) {
            return result.data;
        }
        return [];
    } catch (error) {
        return [];
    }
}