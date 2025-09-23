import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getUnixTimestamp } from "../Statistics";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);

    // Update player's left date and save to database if exists in playerList
    if (window.gameRoom.playerList.has(player.id)) {
        const playerData = window.gameRoom.playerList.get(player.id)!;
        playerData.entrytime.leftDate = getUnixTimestamp();
        
        // Save player data to database before removing
        try {
            await window._updatePlayerDB(window.gameRoom.config._RUID, {
                auth: playerData.auth,
                conn: playerData.conn,
                name: playerData.name,
                rating: playerData.stats.rating,
                totals: playerData.stats.totals,
                disconns: playerData.stats.disconns,
                wins: playerData.stats.wins,
                goals: playerData.stats.goals,
                assists: playerData.stats.assists,
                ogs: playerData.stats.ogs,
                losePoints: playerData.stats.losePoints,
                balltouch: playerData.stats.balltouch,
                passed: playerData.stats.passed,
                mute: playerData.permissions.mute,
                muteExpire: playerData.permissions.muteExpire,
                rejoinCount: playerData.entrytime.rejoinCount,
                joinDate: playerData.entrytime.joinDate,
                leftDate: playerData.entrytime.leftDate,
                malActCount: playerData.permissions.malActCount
            });
        } catch (error) {
            window.gameRoom.logger.w('onPlayerLeave', `Failed to save player data to database: ${error}`);
        }
        
        // Remove from playerList
        window.gameRoom.playerList.delete(player.id);
    }

    // Emit websocket event if function exists
    if (typeof window._emitSIOPlayerInOutEvent === 'function') {
        window._emitSIOPlayerInOutEvent(player.id);
    }
}