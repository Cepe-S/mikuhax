import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdDebugCoordinator(byPlayer: PlayerObject, fullMessage?: string): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) return;

    // Check admin permissions
    const isAdmin = byPlayer.admin || playerData.permissions.superadmin;
    if (!isAdmin) {
        window.gameRoom._room.sendAnnouncement("❌ Solo administradores pueden usar este comando", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    // Get coordinator stats from both managers
    const balanceStatus = window.gameRoom.balanceManager.getStatus();
    const stadiumStatus = window.gameRoom.stadiumManager.getDebugStatus();

    window.gameRoom._room.sendAnnouncement("🔧 ESTADO DEL COORDINADOR DE JUEGO", byPlayer.id, 0x5DADE2, "bold", 1);
    
    // Balance Manager Coordinator
    if (balanceStatus.coordinator) {
        window.gameRoom._room.sendAnnouncement(
            `⚖️ Balance Coordinator: ${balanceStatus.coordinator.isProcessing ? '🔄 Procesando' : '✅ Listo'} | Pendientes: ${balanceStatus.coordinator.pendingActions}`,
            byPlayer.id,
            balanceStatus.coordinator.isProcessing ? 0xFFD700 : 0x00AA00,
            "normal",
            0
        );
        
        if (balanceStatus.coordinator.timeSinceLastAction < 5000) {
            window.gameRoom._room.sendAnnouncement(
                `⏱️ Última acción hace: ${Math.round(balanceStatus.coordinator.timeSinceLastAction / 1000)}s`,
                byPlayer.id,
                0x479947,
                "small",
                0
            );
        }
    }
    
    // Stadium Manager Coordinator
    if (stadiumStatus.coordinator) {
        window.gameRoom._room.sendAnnouncement(
            `🏟️ Stadium Coordinator: ${stadiumStatus.coordinator.isProcessing ? '🔄 Procesando' : '✅ Listo'} | Pendientes: ${stadiumStatus.coordinator.pendingActions}`,
            byPlayer.id,
            stadiumStatus.coordinator.isProcessing ? 0xFFD700 : 0x00AA00,
            "normal",
            0
        );
        
        if (stadiumStatus.coordinator.timeSinceLastAction < 5000) {
            window.gameRoom._room.sendAnnouncement(
                `⏱️ Última acción hace: ${Math.round(stadiumStatus.coordinator.timeSinceLastAction / 1000)}s`,
                byPlayer.id,
                0x479947,
                "small",
                0
            );
        }
    }

    // Game state info
    const gameScores = window.gameRoom._room.getScores();
    const gameState = gameScores ? "🎮 Jugando" : "⏸️ Parado";
    
    window.gameRoom._room.sendAnnouncement(
        `🎯 Estado del juego: ${gameState} | Estadio: ${stadiumStatus.currentStadium} (${stadiumStatus.currentState})`,
        byPlayer.id,
        0x00AA00,
        "normal",
        0
    );
    
    window.gameRoom._room.sendAnnouncement(
        `👥 Jugadores: ${stadiumStatus.playerCount}/${stadiumStatus.minPlayers} | R:${balanceStatus.redCount} vs B:${balanceStatus.blueCount}`,
        byPlayer.id,
        0x479947,
        "small",
        0
    );
}

registerCommand("debugcoordinator", cmdDebugCoordinator, {
    helpText: "Muestra el estado del coordinador de juego (solo admins)",
    category: "Admin Commands",
    adminOnly: true
});