import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { TeamID } from "../../model/GameObject/TeamID";
import { BalanceMode } from "../balance/BalanceConfig";

export function cmdBalanceStatus(byPlayer: PlayerObject, fullMessage?: string): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) return;

    // Check admin permissions
    const isAdmin = byPlayer.admin || playerData.permissions.superadmin;
    if (!isAdmin) {
        window.gameRoom._room.sendAnnouncement("❌ Solo administradores pueden usar este comando", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const balanceStatus = window.gameRoom.balanceManager.getStatus();
    const queueSystem = window.gameRoom.balanceManager.getQueueSystem();
    
    // Count players by team and AFK status
    let redCount = 0, blueCount = 0, specCount = 0, afkCount = 0;
    const afkPlayers: string[] = [];
    
    for (const [playerId, player] of window.gameRoom.playerList) {
        if (player.permissions.afkmode) {
            afkCount++;
            afkPlayers.push(`${player.name}#${playerId}`);
        } else {
            switch (player.team) {
                case TeamID.Red:
                    redCount++;
                    break;
                case TeamID.Blue:
                    blueCount++;
                    break;
                case TeamID.Spec:
                    specCount++;
                    break;
            }
        }
    }

    // Send balance status
    window.gameRoom._room.sendAnnouncement("📊 ESTADO DEL SISTEMA DE BALANCEO", byPlayer.id, 0x5DADE2, "bold", 1);
    
    window.gameRoom._room.sendAnnouncement(
        `⚙️ Configuración: ${balanceStatus.config.enabled ? '✅ Habilitado' : '❌ Deshabilitado'} | Modo: ${balanceStatus.config.mode.toUpperCase()} | Máx por equipo: ${balanceStatus.config.maxPlayersPerTeam}`,
        byPlayer.id,
        0x479947,
        "normal",
        0
    );
    
    window.gameRoom._room.sendAnnouncement(
        `🏆 Equipos: Rojo ${redCount} vs ${blueCount} Azul | Espectadores: ${specCount} | AFK: ${afkCount}`,
        byPlayer.id,
        0x00AA00,
        "normal",
        0
    );
    
    if (balanceStatus.config.mode === BalanceMode.PRO) {
        window.gameRoom._room.sendAnnouncement(
            `📋 Cola PRO: ${balanceStatus.queueLength} jugadores esperando`,
            byPlayer.id,
            0xFFD700,
            "normal",
            0
        );
        
        if (balanceStatus.queueLength > 0) {
            const queueNames = balanceStatus.queue.slice(0, 5).map(entry => `${entry.playerName}#${entry.playerId}`).join(", ");
            const moreText = balanceStatus.queueLength > 5 ? ` (+${balanceStatus.queueLength - 5} más)` : "";
            window.gameRoom._room.sendAnnouncement(
                `👥 En cola: ${queueNames}${moreText}`,
                byPlayer.id,
                0xFFD700,
                "small",
                0
            );
        }
    }
    
    if (afkCount > 0) {
        const afkText = afkPlayers.slice(0, 3).join(", ");
        const moreAfkText = afkCount > 3 ? ` (+${afkCount - 3} más)` : "";
        window.gameRoom._room.sendAnnouncement(
            `😴 Jugadores AFK: ${afkText}${moreAfkText}`,
            byPlayer.id,
            0xFF7777,
            "small",
            0
        );
    }
    
    window.gameRoom._room.sendAnnouncement(
        `🔄 Estado: ${balanceStatus.isProcessing ? 'Procesando...' : 'Listo'}`,
        byPlayer.id,
        balanceStatus.isProcessing ? 0xFFD700 : 0x00AA00,
        "small",
        0
    );
}

registerCommand("balancestatus", cmdBalanceStatus, {
    helpText: "Muestra el estado actual del sistema de balanceo (solo admins)",
    category: "Admin Commands",
    adminOnly: true
});