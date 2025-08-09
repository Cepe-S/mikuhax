import { Player } from "../model/GameObject/Player";
import { PlayerStorage } from "../model/GameObject/PlayerObject";
import { BanList } from "../model/PlayerBan/BanList";
import { MatchEvent } from "../model/GameObject/MatchEvent";
import { MatchSummary } from "../model/GameObject/MatchSummary";

// Utilities
export function convertToPlayerStorage(player: Player): PlayerStorage {
    return {
        auth: player.auth, // same meaning as in PlayerObject. It can used for identify each of players.
        conn: player.conn, // same meaning as in PlayerObject.
        name: player.name, // save for compare player's current name and previous name.
        rating: player.stats.rating, // HElo Rating points
        totals: player.stats.totals, // total games include wins and disconns
        disconns: player.stats.disconns, // disconnected games
        wins: player.stats.wins, // the game wins
        goals: player.stats.goals, // not contains OGs.
        assists: player.stats.assists, // count for assist goal
        ogs: player.stats.ogs, // it means 'own goal' (in Korean, '자책골')
        losePoints: player.stats.losePoints, // it means the points this player lost (in Korean, '실점')
        balltouch: player.stats.balltouch, // total count of touch(kick) ball
        passed: player.stats.passed, // total count of pass success
        mute: player.permissions.mute, // is this player muted? 
        muteExpire: player.permissions.muteExpire, // expiration date of mute. -1 means Permanent mute.. (unix timestamp)
        rejoinCount: player.entrytime.rejoinCount, // How many rejoins this player has made.
        joinDate: player.entrytime.joinDate, // player join time
        leftDate: player.entrytime.leftDate, // player left time
        malActCount: player.permissions.malActCount // count for malicious behaviour like Brute force attack
    }
}

// CRUDs with DB Server by injected functions from Node Main Application
// register new player or update it
export async function setPlayerDataToDB(playerStorage: PlayerStorage): Promise<void> {
    const player: PlayerStorage | undefined = await window._readPlayerDB(window.gameRoom.config._RUID, playerStorage.auth);
    if(player !== undefined) {
        //if already exist then update it
        await window._updatePlayerDB(window.gameRoom.config._RUID, playerStorage);
    } else {
        // or create new one
        await window._createPlayerDB(window.gameRoom.config._RUID, playerStorage);
    }
}

// CRUDs for match_event
export async function setMatchEventDataToDB(matchEvent: MatchEvent): Promise<void> {
    await window._createMatchEventDB(window.gameRoom.config._RUID, matchEvent);
}

// CRUDs for match_summary
export async function setMatchSummaryDataToDB(matchSummary: MatchSummary): Promise<void> {
    await window._createMatchSummaryDB(window.gameRoom.config._RUID, matchSummary);
}

// get player data
export async function getPlayerDataFromDB(playerAuth: string): Promise<PlayerStorage | undefined> {
    const player: PlayerStorage | undefined = await window._readPlayerDB(window.gameRoom.config._RUID, playerAuth);
    return player;
}

// register new ban or update it
export async function setBanlistDataToDB(banList: BanList): Promise<void> {
    const banplayer: BanList | undefined = await window._readBanlistDB(window.gameRoom.config._RUID, banList.conn);
    if(banplayer !== undefined) {
        //if already exist then update it
        await window._updateBanlistDB(window.gameRoom.config._RUID, banList);
    } else {
        // or create new one
        await window._createBanlistDB(window.gameRoom.config._RUID, banList);
    }
}

// get exist ban
export async function getBanlistDataFromDB(playerConn: string): Promise<BanList | undefined> {
    const banplayer: BanList | undefined = await window._readBanlistDB(window.gameRoom.config._RUID, playerConn);
    return banplayer;
}

// get ban by auth (new system)
export async function getBanByAuthFromDB(playerAuth: string): Promise<any> {
    return await window._readBanByAuthDB(window.gameRoom.config._RUID, playerAuth);
}

// get mute by auth (new system)
export async function getMuteByAuthFromDB(playerAuth: string): Promise<any> {
    return await window._readMuteByAuthDB(window.gameRoom.config._RUID, playerAuth);
}

// remove exist ban
export async function removeBanlistDataFromDB(playerConn: string): Promise<void> {
    await window._deleteBanlistDB(window.gameRoom.config._RUID, playerConn);
}

// remove ban by auth (new system)
export async function removeBanByAuthFromDB(playerAuth: string): Promise<boolean> {
    return await window._deleteBanByAuthDB(window.gameRoom.config._RUID, playerAuth);
}

// remove mute by auth (new system)
export async function removeMuteByAuthFromDB(playerAuth: string): Promise<boolean> {
    return await window._deleteMuteByAuthDB(window.gameRoom.config._RUID, playerAuth);
}

// Unified Top functions
export async function getTopByRangeFromDB(type: 'goal' | 'assist', from?: number, to?: number, limit?: number): Promise<{playerAuth: string, playerName: string, count: number}[]> {
    return await window._getTopByRangeDB(window.gameRoom.config._RUID, type, from, to, limit);
}

// Get all players from database
export async function getAllPlayersFromDB(): Promise<PlayerStorage[]> {
    return await window._getAllPlayersFromDB(window.gameRoom.config._RUID);
}

// Connection tracking functions
export async function trackConnectionToDB(connectionData: {
    auth: string;
    nickname: string;
    ipAddress: string;
    timestamp: number;
    eventType: 'join' | 'rejoin' | 'kick' | 'ban';
    country: string;
    city: string;
    isp: string;
}): Promise<void> {
    const dataWithRUID = {
        ...connectionData,
        ruid: window.gameRoom.config._RUID
    };
    return await window._trackConnectionDB(dataWithRUID);
}

export async function getConnectionAnalyticsFromDB(auth: string): Promise<any> {
    return await window._getConnectionAnalyticsDB(auth);
}
