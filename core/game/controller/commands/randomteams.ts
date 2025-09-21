import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { setRandomTeamColors } from "../RoomTools";
import { registerCommand } from "../CommandRegistry";

export function cmdRandomTeams(byPlayer: PlayerObject, message: string): void {
    // Check if player has admin permissions
    if (!window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin && !window.gameRoom.playerList.get(byPlayer.id)?.admin) {
        window.gameRoom._room.sendAnnouncement(
            "🚫 Solo los administradores pueden usar este comando.", 
            byPlayer.id, 
            0xFF6347, 
            "normal", 
            1
        );
        return;
    }

    // Change to random teams
    if (setRandomTeamColors()) {
        window.gameRoom._room.sendAnnouncement(
            `✅ ${byPlayer.name} cambió los equipos aleatoriamente.`,
            null,
            0x00FF00,
            "bold",
            1
        );
    } else {
        window.gameRoom._room.sendAnnouncement(
            "❌ Error al cambiar los equipos.",
            byPlayer.id,
            0xFF6347,
            "normal",
            1
        );
    }
}

// Register the command
registerCommand("randomteams", cmdRandomTeams, {
    helpText: "Cambiar a equipos aleatorios. Uso: !randomteams",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});

registerCommand("rt", cmdRandomTeams, {
    helpText: "Cambiar a equipos aleatorios (alias). Uso: !rt",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});