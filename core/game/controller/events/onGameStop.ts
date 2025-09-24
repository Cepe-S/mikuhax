import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGameStopListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGameStop', `Game stopped by ${byPlayer ? byPlayer.name : 'system'}.`);
    window.gameRoom.isGamingNow = false;
    
    // Initialize match debug actions if not exists
    if (!window.gameRoom.matchDebugActions) {
        window.gameRoom.matchDebugActions = [];
    }
    
    // Add debug action
    window.gameRoom.matchDebugActions.unshift({
        timestamp: Date.now(),
        action: "GAME_STOP",
        playerName: byPlayer ? byPlayer.name : undefined,
        playerId: byPlayer ? byPlayer.id : undefined,
        details: `Game stopped by ${byPlayer ? byPlayer.name : 'system'}`
    });
    
    // Keep only last 20 actions
    if (window.gameRoom.matchDebugActions.length > 20) {
        window.gameRoom.matchDebugActions = window.gameRoom.matchDebugActions.slice(0, 20);
    }
    
    // Let stadium manager handle stadium changes
    if (window.gameRoom.stadiumManager) {
        window.gameRoom.stadiumManager.onGameEnd();
    }
    
    // GARANTIZAR que se inicie un nuevo juego si auto-operating está activo
    if (window.gameRoom.config.rules.autoOperating === true) {
        setTimeout(() => {
            if (window.gameRoom._room.getScores() === null) {
                window.gameRoom._room.startGame();
                window.gameRoom.logger.i('onGameStop', 'Auto-started new game after stop');
            }
        }, 2000);
    }
}