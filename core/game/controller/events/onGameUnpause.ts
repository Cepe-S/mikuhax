import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { balanceDuringMatch } from "../../model/OperateHelper/Quorum";

export function onGameUnpauseListener(byPlayer: PlayerObject | null): void {
    window.gameRoom.isGamingNow = true; // turn on

    // if auto emcee mode is enabled
    if(window.gameRoom.config.rules.autoOperating === true) {
        if(window.gameRoom.isGamingNow === true) { // when game is in match
            // Usar balanceo inteligente durante partidas
            balanceDuringMatch('game unpause');
        }
    }
}
