import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function onGamePauseListener(byPlayer: PlayerObject | null): void {
    window.gameRoom.isGamingNow = false; // turn off

    if(window.gameRoom.config.rules.autoOperating === true) { // if auto operating mode is enabled
        if(byPlayer === null) {
            // Game paused automatically (e.g., by system)
            window.gameRoom._room.sendAnnouncement(LangRes.onGamePause.readyForStart, null, 0x00FF00, "normal", 2);
            setTimeout(() => {
                window.gameRoom._room.pauseGame(false); // resume after 5 seconds
            }, 5000);
        } else {
            // Game paused manually by a player
            window.gameRoom._room.sendAnnouncement(`⏸️ Juego pausado por ${byPlayer.name}. El juego se reanudará automáticamente en 30 segundos.`, null, 0xFFFF00, "normal", 2);
            setTimeout(() => {
                // Auto-resume after 30 seconds even if paused manually
                window.gameRoom._room.pauseGame(false);
                window.gameRoom._room.sendAnnouncement("⏯️ Juego reanudado automáticamente.", null, 0x00FF00, "normal", 2);
            }, 30000); // 30 seconds for manual pauses
        }
    }
}
