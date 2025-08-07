import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getPlayerConnectionAnalytics, checkSuspiciousActivity } from "../ConnectionTracker";
import { getLocalPlayerAnalytics } from "../LocalConnectionTracker";
import { registerCommand } from "../CommandRegistry";

export async function cmdConnectionStats(byPlayer: PlayerObject, message?: string): Promise<void> {
    // Solo superadmins pueden usar este comando
    if (!window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(`❌ Solo superadmins pueden usar este comando.`, byPlayer.id, 0xFF0000, "normal", 0);
        return;
    }

    try {
        let targetPlayer: PlayerObject | undefined;

        if (message !== undefined && message.trim() !== "") {
            // Buscar jugador por ID (#X) o por nombre
            if (message.charAt(0) === "#") {
                const targetID = parseInt(message.substr(1), 10);
                if (!isNaN(targetID) && window.gameRoom.playerList.has(targetID)) {
                    targetPlayer = window.gameRoom._room.getPlayerList().find(p => p.id === targetID);
                }
            } else {
                // Buscar por nombre
                const playerList = window.gameRoom._room.getPlayerList();
                targetPlayer = playerList.find(p => p.name.toLowerCase().includes(message.toLowerCase()));
            }
            
            if (!targetPlayer) {
                window.gameRoom._room.sendAnnouncement(`❌ Jugador "${message}" no encontrado.`, byPlayer.id, 0xFF0000, "normal", 0);
                return;
            }
        } else {
            // Si no se especifica jugador, usar el que ejecuta el comando
            targetPlayer = byPlayer;
        }

        // Obtener datos locales del jugador
        const localAnalytics = getLocalPlayerAnalytics(targetPlayer.auth);
        const playerData = window.gameRoom.playerList.get(targetPlayer.id);
        
        if (!localAnalytics && !playerData) {
            window.gameRoom._room.sendAnnouncement(`❌ No se encontraron datos para ${targetPlayer.name}.`, byPlayer.id, 0xFF0000, "normal", 0);
            return;
        }

        let statsMessage: string;

        if (localAnalytics) {
            // Mostrar datos completos de tracking local
            const uniqueIPsCount = localAnalytics.uniqueIPs.size;
            const uniqueNicksCount = localAnalytics.nicknames.size;
            const suspiciousFlag = uniqueIPsCount > 3 ? "⚠️ MÚLTIPLES IPs" : "✅ Normal";
            const recentConnections = localAnalytics.recentConnections.slice(-5);

            statsMessage = `📊 Estadísticas de conexión de ${targetPlayer.name}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 Auth: ${targetPlayer.auth}
🌐 Última IP: ${recentConnections.length > 0 ? recentConnections[recentConnections.length - 1].ipAddress : 'N/A'}
⏰ Primera conexión: ${new Date(localAnalytics.firstSeen).toLocaleString()}
🔄 Última conexión: ${new Date(localAnalytics.lastSeen).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Total conexiones: ${localAnalytics.totalConnections}
🌐 IPs únicas: ${uniqueIPsCount}
👤 Nicknames únicos: ${uniqueNicksCount}
📊 Rating actual: ${playerData?.stats.rating || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Estado: ${suspiciousFlag}
💾 Datos almacenados localmente`;

            window.gameRoom._room.sendAnnouncement(statsMessage, byPlayer.id, 0x00FF00, "normal", 0);

            // Mostrar conexiones recientes si existen
            if (recentConnections.length > 0) {
                const recentMessage = `📝 Últimas ${recentConnections.length} conexiones:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recentConnections.map((conn, index) => 
    `${index + 1}. ${new Date(conn.timestamp).toLocaleString()} - ${conn.ipAddress} (${conn.nickname})`
).join('\n')}`;

                window.gameRoom._room.sendAnnouncement(recentMessage, byPlayer.id, 0x00FF00, "normal", 0);
            }

        } else if (playerData) {
            // Mostrar solo información básica de la sesión actual
            statsMessage = `📊 Información básica de ${targetPlayer.name}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 Auth: ${targetPlayer.auth}
🌐 Conexión: ${targetPlayer.conn}
⏰ Sesión actual desde: ${new Date(playerData.entrytime.joinDate).toLocaleString()}
📈 Partidos jugados: ${playerData.stats.totals}
🏆 Victorias: ${playerData.stats.wins}
⚽ Goles: ${playerData.stats.goals}
🎯 Asistencias: ${playerData.stats.assists}
📊 Rating: ${playerData.stats.rating}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ Sin historial de conexiones previo`;

            window.gameRoom._room.sendAnnouncement(statsMessage, byPlayer.id, 0x00FF00, "normal", 0);
        }

        // Log para debugging
        window.gameRoom.logger.i('cmdConnectionStats', `Stats requested for ${targetPlayer.name} by ${byPlayer.name}`);

    } catch (error) {
        window.gameRoom.logger.e('cmdConnectionStats', `Error: ${error}`);
        window.gameRoom._room.sendAnnouncement(`❌ Error al obtener estadísticas.`, byPlayer.id, 0xFF0000, "normal", 0);
    }
}

// Register the command
registerCommand("connstats", cmdConnectionStats, {
    helpText: "Ver estadísticas de conexión. Uso: !connstats [#ID o nombre]",
    category: "Admin Commands",
    superAdminOnly: true
});
