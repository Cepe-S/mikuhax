import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { registerCommand } from "../CommandRegistry";

export function cmdScout(byPlayer: PlayerObject): void {
    if (window.gameRoom.config.rules.statsRecord == true && window.gameRoom.isStatRecord == true) {
        const players = window.gameRoom._room.getPlayerList();
        let redCount = 0, blueCount = 0;
        
        players.forEach(player => {
            if (player.team === TeamID.Red) redCount++;
            else if (player.team === TeamID.Blue) blueCount++;
        });
        
        window.gameRoom._room.sendAnnouncement("📊 Análisis de Equipos:", byPlayer.id, 0x479947, "normal", 1);
        window.gameRoom._room.sendAnnouncement(`🔴 Equipo Rojo: ${redCount} jugadores`, byPlayer.id, 0xFD2C2D, "normal", 0);
        window.gameRoom._room.sendAnnouncement(`🔵 Equipo Azul: ${blueCount} jugadores`, byPlayer.id, 0x18fde8, "normal", 0);
        window.gameRoom._room.sendAnnouncement(`⚖️ Diferencia: ${Math.abs(redCount - blueCount)} jugadores`, byPlayer.id, 0xFFFF00, "normal", 0);
    } else {
        window.gameRoom._room.sendAnnouncement(LangRes.command.scout._ErrorNoMode, byPlayer.id, 0xFF7777, "normal", 2);
    }
}

// Register the command
registerCommand("scout", cmdScout, {
    helpText: "🔍 Analiza el balance de ELO entre equipos durante el juego",
    category: "Game Commands"
});