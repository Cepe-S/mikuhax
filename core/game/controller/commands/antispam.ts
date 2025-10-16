import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdAntispam(byPlayer: PlayerObject, fullMessage?: string): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id)!;
    const isAdmin = byPlayer.admin || playerData.permissions.superadmin;
    
    if (!isAdmin) {
        window.gameRoom._room.sendAnnouncement("❌ Solo los administradores pueden usar este comando.", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    const msgChunk = fullMessage ? fullMessage.split(" ") : [];
    const subCommand = msgChunk[1]?.toLowerCase();

    switch (subCommand) {
        case "stats":
            showStats(byPlayer);
            break;
        case "logs":
            showLogs(byPlayer);
            break;
        case "clear":
            clearLogs(byPlayer);
            break;
        case "status":
            showStatus(byPlayer);
            break;
        default:
            showHelp(byPlayer);
            break;
    }
}

function showStats(byPlayer: PlayerObject): void {
    const stats = window.gameRoom.chatFloodManager.getStats();
    const settings = window.gameRoom.config.settings;
    
    window.gameRoom._room.sendAnnouncement(
        `📊 Estadísticas Antispam:\n` +
        `• Jugadores monitoreados: ${stats.activeTrackers}\n` +
        `• Logs registrados: ${stats.totalLogs}\n` +
        `• Límite de mensajes: ${settings.chatFloodCriterion} en ${settings.chatFloodIntervalMillisecs/1000}s\n` +
        `• Tiempo de muteo: ${settings.antiSpamMuteTimeMillisecs/60000} minutos`,
        byPlayer.id,
        0x00AA00,
        "normal",
        1
    );
}

function showLogs(byPlayer: PlayerObject): void {
    const logs = window.gameRoom.chatFloodManager.getAntiSpamLogs();
    
    if (logs.length === 0) {
        window.gameRoom._room.sendAnnouncement("📝 No hay logs de antispam registrados.", byPlayer.id, 0x479947, "normal", 1);
        return;
    }

    const recentLogs = logs.slice(-5); // Últimos 5 logs
    let message = `📝 Últimos ${recentLogs.length} eventos de antispam:\n`;
    
    recentLogs.forEach((log, index) => {
        const date = new Date(log.timestamp).toLocaleTimeString();
        message += `${index + 1}. [${date}] ${log.playerName}#${log.playerId} - ${log.muteTimeMinutes}min\n`;
    });
    
    if (logs.length > 5) {
        message += `... y ${logs.length - 5} más. Usa !antispam clear para limpiar.`;
    }

    window.gameRoom._room.sendAnnouncement(message, byPlayer.id, 0x479947, "normal", 1);
}

function clearLogs(byPlayer: PlayerObject): void {
    window.gameRoom.chatFloodManager.clearAntiSpamLogs();
    window.gameRoom._room.sendAnnouncement("🗑️ Logs de antispam limpiados.", byPlayer.id, 0x00AA00, "normal", 1);
}

function showStatus(byPlayer: PlayerObject): void {
    const settings = window.gameRoom.config.settings;
    const status = settings.antiChatFlood && settings.antiSpamMuteEnabled ? "🟢 Activado" : "🔴 Desactivado";
    
    window.gameRoom._room.sendAnnouncement(
        `🛡️ Estado del Sistema Antispam: ${status}\n` +
        `• Detección de flood: ${settings.antiChatFlood ? "✅" : "❌"}\n` +
        `• Muteo automático: ${settings.antiSpamMuteEnabled ? "✅" : "❌"}\n` +
        `• Logging: ${settings.antiSpamMuteLogEnabled ? "✅" : "❌"}`,
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
}

function showHelp(byPlayer: PlayerObject): void {
    window.gameRoom._room.sendAnnouncement(
        `🛡️ Comandos Antispam:\n` +
        `• !antispam status - Estado del sistema\n` +
        `• !antispam stats - Estadísticas\n` +
        `• !antispam logs - Ver logs recientes\n` +
        `• !antispam clear - Limpiar logs`,
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
}

// Registrar el comando
registerCommand("antispam", cmdAntispam, {
    helpText: "Administrar el sistema antispam (solo admins)",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true,
    superAdminOnly: false
});