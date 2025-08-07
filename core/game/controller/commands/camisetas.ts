import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getRandomMatch } from "../../resource/realTeams";
import { TeamID } from "../../model/GameObject/TeamID";
import { registerCommand } from "../CommandRegistry";

export function cmdCamisetas(byPlayer: PlayerObject): void {
    const match = getRandomMatch();
    if (match) {
        window.gameRoom._room.setTeamColors(TeamID.Red, match.red.angle, match.red.textColour, [match.red.teamColour1, match.red.teamColour2, match.red.teamColour3]);
        window.gameRoom._room.setTeamColors(TeamID.Blue, match.blue.angle, match.blue.textColour, [match.blue.teamColour1, match.blue.teamColour2, match.blue.teamColour3]);
        window.gameRoom._room.sendAnnouncement(`⚽ Nuevas camisetas: ${match.red.name} vs ${match.blue.name}`, null, 0xFFFFFF, "bold", 1);
    } else {
        window.gameRoom._room.sendAnnouncement("❌ Error al cambiar camisetas", byPlayer.id, 0xFF0000, "normal", 1);
    }
}

// Register the command
registerCommand("camisetas", cmdCamisetas, {
    helpText: "Cambiar camisetas a equipos reales aleatorios",
    category: "Admin Commands",
    adminOnly: true
});