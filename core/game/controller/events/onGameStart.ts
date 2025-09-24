import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGameStartListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGameStart', `Game started by ${byPlayer ? byPlayer.name : 'system'}.`);
    window.gameRoom.isGamingNow = true;
    
    // Initialize match events holder
    window.gameRoom.matchEventsHolder = [];
    
    // Initialize match debug actions if not exists
    if (!window.gameRoom.matchDebugActions) {
        window.gameRoom.matchDebugActions = [];
    }
    
    // Add debug action
    window.gameRoom.matchDebugActions.unshift({
        timestamp: Date.now(),
        action: "GAME_START",
        playerName: byPlayer ? byPlayer.name : undefined,
        playerId: byPlayer ? byPlayer.id : undefined,
        details: `Game started by ${byPlayer ? byPlayer.name : 'system'}`
    });
    
    // Keep only last 20 actions
    if (window.gameRoom.matchDebugActions.length > 20) {
        window.gameRoom.matchDebugActions = window.gameRoom.matchDebugActions.slice(0, 20);
    }
    
    // Reset ball possession tracking
    if (window.gameRoom.ballStack) {
        window.gameRoom.ballStack.possClear();
        window.gameRoom.ballStack.initTouchInfo();
    }
    
    // Reset all players' match records
    window.gameRoom.playerList.forEach((player) => {
        player.matchRecord = {
            goals: 0,
            assists: 0,
            ogs: 0,
            losePoints: 0,
            balltouch: 0,
            passed: 0,
            factorK: 24
        };
    });
}