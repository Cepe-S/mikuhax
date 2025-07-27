
import "dotenv/config";
import axios from "axios";
import { PlayerStorage } from "../game/model/GameObject/PlayerObject";
import { winstonLogger } from "../winstonLoggerSystem";
import { BanList } from "../game/model/PlayerBan/BanList";
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

export async function createBanlistDB(ruid: string, banList: BanList): Promise<void> {
    try {
        const result = await axios.post(`${dbConnAddr}room/${ruid}/banlist`, banList);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on createBanlistDB: Created. conn(${banList.conn})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 400) {
            winstonLogger.info(`${err.response.status} Failed on createBanlistDB: Already exist. conn(${banList.conn})`);
        } else {
            winstonLogger.error(`Error caught on createBanlistDB: ${error}`);
        }
    }
}

export async function readBanlistDB(ruid: string, playerConn: string): Promise<BanList | undefined> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/banlist/${playerConn}`);
        if (result.status === 200 && result.data) {
            const banlist: BanList = {
                conn: result.data.conn,
                reason: result.data.reason,
                register: result.data.register,
                expire: result.data.expire
            }
            winstonLogger.info(`200 Succeed on readBanlistDB: Read. onn(${playerConn})`);
            return banlist;
        }
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on readBanlistDB: No exist. conn(${playerConn})`);
        } else {
            winstonLogger.error(`Error caught on readBanlistDB: ${error}`);
        }
    }
}

export async function updateBanlistDB(ruid: string, banList: BanList):Promise<void> {
    try {
        const result = await axios.put(`${dbConnAddr}room/${ruid}/banlist/${banList.conn}`, banList);
        if (result.status === 204 && result.data) {
            winstonLogger.info(`${result.status} Succeed on updateBanlistDB: Updated. conn(${banList.conn})`);
        }
    } catch(error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on updateBanlistDB: No Exist. conn(${banList.conn})`);
        } else {
            winstonLogger.error(`Error caught on updateBanlistDB: ${error}`);
        }
    }
}

export async function deleteBanlistDB(ruid: string, playerConn: string): Promise<void> {
    try {
        const result = await axios.delete(`${dbConnAddr}room/${ruid}/banlist/${playerConn}`);
        if (result.status === 204) {
            winstonLogger.info(`${result.status} Succeed on deleteBanlistDB: Deleted. conn(${playerConn})`);
        }
    } catch (error) {
        const err = error as any;
        if(err.response && err.response.status === 404) {
            winstonLogger.info(`${err.response.status} Failed on deleteBanlistDB: No exist. conn(${playerConn})`);
        } else {
            winstonLogger.error(`Error caught on deleteBanlistDB: ${error}`);
        }
    }
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

// Top scorers functions
export async function getTopScorersGlobalDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top-scorers/global`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopScorersGlobalDB`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopScorersGlobalDB: ${error}`);
        return [];
    }
}

export async function getTopScorersMonthlyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top-scorers/monthly`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopScorersMonthlyDB`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopScorersMonthlyDB: ${error}`);
        return [];
    }
}

export async function getTopScorersDailyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top-scorers/daily`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopScorersDailyDB`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopScorersDailyDB: ${error}`);
        return [];
    }
}

// Top assisters functions
export async function getTopAssistersGlobalDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top-assisters/global`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopAssistersGlobalDB`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopAssistersGlobalDB: ${error}`);
        return [];
    }
}

export async function getTopAssistersMonthlyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top-assisters/monthly`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopAssistersMonthlyDB`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopAssistersMonthlyDB: ${error}`);
        return [];
    }
}

export async function getTopAssistersDailyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]> {
    try {
        const result = await axios.get(`${dbConnAddr}room/${ruid}/match_event/top-assisters/daily`);
        if (result.status === 200 && result.data) {
            winstonLogger.info(`200 Succeed on getTopAssistersDailyDB`);
            return result.data;
        }
        return [];
    } catch (error) {
        winstonLogger.error(`Error caught on getTopAssistersDailyDB: ${error}`);
        return [];
    }
}