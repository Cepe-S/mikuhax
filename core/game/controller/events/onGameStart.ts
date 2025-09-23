import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGameStartListener(byPlayer: PlayerObject): void {
    window.gameRoom.logger.i('onGameStart', `Game started by ${byPlayer ? byPlayer.name : 'system'}.`);
    window.gameRoom.isGamingNow = true;
    
    // Initialize match events holder
    window.gameRoom.matchEventsHolder = [];
    
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