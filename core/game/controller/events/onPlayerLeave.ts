import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { getUnixTimestamp } from "../Statistics";

export async function onPlayerLeaveListener(player: PlayerObject): Promise<void> {
    window.gameRoom.logger.i('onPlayerLeave', `${player.name}#${player.id} has left.`);

    // Check if player was AFK before leaving
    let wasAfk = false;
    if (window.gameRoom.playerList.has(player.id)) {
        const playerData = window.gameRoom.playerList.get(player.id)!;
        wasAfk = playerData.permissions.afkmode;
    }
    
    // Add match debug action
    if (!window.gameRoom.matchDebugActions) {
        window.gameRoom.matchDebugActions = [];
    }
    
    window.gameRoom.matchDebugActions.unshift({
        timestamp: Date.now(),
        action: "PLAYER_LEAVE",
        playerName: player.name,
        playerId: player.id,
        details: `Player left the room${wasAfk ? ' (was AFK)' : ''}`
    });
    
    // Keep only last 20 actions
    if (window.gameRoom.matchDebugActions.length > 20) {
        window.gameRoom.matchDebugActions = window.gameRoom.matchDebugActions.slice(0, 20);
    }

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

    // Balance system integration - only if player wasn't AFK
    // AFK players disconnecting from spectator shouldn't trigger balance
    if (!wasAfk) {
        window.gameRoom.logger.i('onPlayerLeave', `Calling balance system for player ${player.name}#${player.id}`);
        window.gameRoom.balanceManager.onPlayerLeave(player.id);
        window.gameRoom.logger.i('onPlayerLeave', `Balance system call completed for player ${player.name}#${player.id}`);
    } else {
        window.gameRoom.logger.i('onPlayerLeave', `Player ${player.name}#${player.id} was AFK - skipping balance system call`);
        // Still log the leave for AFK players but don't trigger balance
        window.gameRoom.balanceManager.getDebugger().logAction(
            "PLAYER_LEAVE",
            player.id,
            player.name,
            TeamID.Spec, // AFK players are always in spec when they leave
            TeamID.Spec,
            "AFK player disconnected",
            window.gameRoom.balanceManager.getConfig().mode,
            window.gameRoom.balanceManager.getStatus().redCount,
            window.gameRoom.balanceManager.getStatus().blueCount,
            window.gameRoom.balanceManager.getStatus().queueLength
        );
    }

    // Check stadium state after player leaves
    setTimeout(() => {
        if (window.gameRoom.stadiumManager) {
            window.gameRoom.stadiumManager.checkPlayerCount();
        }
    }, 100);

    // Emit websocket event if function exists
    if (typeof window._emitSIOPlayerInOutEvent === 'function') {
        window._emitSIOPlayerInOutEvent(player.id);
    }
}