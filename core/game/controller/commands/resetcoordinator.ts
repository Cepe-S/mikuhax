import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdResetCoordinator(byPlayer: PlayerObject, fullMessage?: string): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) return;

    // Check superadmin permissions (this is a critical command)
    const isSuperAdmin = playerData.permissions.superadmin;
    if (!isSuperAdmin) {
        window.gameRoom._room.sendAnnouncement("❌ Solo los superadministradores pueden usar este comando", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    try {
        let resetActions = 0;
        
        // Clear pending actions from both coordinators
        const balanceCoordinator = window.gameRoom.balanceManager.getCoordinator();
        const stadiumCoordinator = window.gameRoom.stadiumManager.getCoordinator();
        
        if (balanceCoordinator) {
            resetActions += balanceCoordinator.clearPendingActions();
        }
        
        if (stadiumCoordinator) {
            resetActions += stadiumCoordinator.clearPendingActions();
        }
        
        // Force restart game if needed
        const gameScores = window.gameRoom._room.getScores();
        if (!gameScores && window.gameRoom.config.rules.autoOperating) {
            window.gameRoom._room.startGame();
            window.gameRoom.logger.i('resetCoordinator', 'Force started game after coordinator reset');
        }
        
        window.gameRoom._room.sendAnnouncement(
            `🔧 Coordinador reiniciado por ${byPlayer.name}`,
            null,
            0xFFD700,
            "bold",
            1
        );
        
        window.gameRoom._room.sendAnnouncement(
            `📊 Acciones pendientes limpiadas: ${resetActions}`,
            byPlayer.id,
            0x00AA00,
            "normal",
            0
        );
        
        window.gameRoom.logger.i('resetCoordinator', `Coordinator reset by ${byPlayer.name}#${byPlayer.id}, cleared ${resetActions} pending actions`);
        
    } catch (error) {
        window.gameRoom.logger.e('resetCoordinator', `Error resetting coordinator: ${error}`);
        window.gameRoom._room.sendAnnouncement("❌ Error al reiniciar el coordinador", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

registerCommand("resetcoordinator", cmdResetCoordinator, {
    helpText: "Reinicia el coordinador de juego en caso de emergencia (solo superadmins)",
    category: "Admin Commands",
    superAdminOnly: true
});