import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { clearAllSubteams } from "./teamup";

// Global teamup system state
let teamupEnabled = true;

// Toggle teamup system
export function cmdTeamupToggle(byPlayer: PlayerObject, message: string): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData || (!playerData.permissions.superadmin && !byPlayer.admin)) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Solo administradores pueden usar este comando",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    teamupEnabled = !teamupEnabled;
    
    if (!teamupEnabled) {
        clearAllSubteams();
        window.gameRoom._room.sendAnnouncement(
            "🔴 Sistema de subequipos DESACTIVADO - Todos los subequipos eliminados",
            null,
            0xFF4444,
            "bold",
            1
        );
    } else {
        window.gameRoom._room.sendAnnouncement(
            "🟢 Sistema de subequipos ACTIVADO",
            null,
            0x44FF44,
            "bold",
            1
        );
    }
    
    window.gameRoom.logger.i('teamupToggle', `${byPlayer.name}#${byPlayer.id} ${teamupEnabled ? 'enabled' : 'disabled'} teamup system`);
}

// Export state checker
export function isTeamupEnabled(): boolean {
    return teamupEnabled;
}

// Expose globally
(global as any).isTeamupEnabled = isTeamupEnabled;

// Register the command
registerCommand("teamuptoggle", cmdTeamupToggle, {
    helpText: "🔄 Activar/desactivar sistema de subequipos (solo admin)",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});