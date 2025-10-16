import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdDebugMute(byPlayer: PlayerObject): void {
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) return;

    // Check admin permissions
    const isAdmin = byPlayer.admin || playerData.permissions.superadmin;
    if (!isAdmin) {
        window.gameRoom._room.sendAnnouncement("❌ Solo administradores pueden usar este comando", byPlayer.id, 0xFF7777, "normal", 2);
        return;
    }

    // Get mute debug actions
    const muteActions = window.gameRoom.muteDebugActions || [];
    
    if (muteActions.length === 0) {
        window.gameRoom._room.sendAnnouncement("🔇 No hay acciones de mute registradas", byPlayer.id, 0x479947, "normal", 1);
        return;
    }

    window.gameRoom._room.sendAnnouncement("🔇 DEBUG SISTEMA DE MUTES", byPlayer.id, 0x5DADE2, "bold", 1);
    window.gameRoom._room.sendAnnouncement("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", byPlayer.id, 0x5DADE2, "normal", 0);

    // Show last 5 mute actions
    const recentActions = muteActions.slice(0, 5);
    
    recentActions.forEach((action, index) => {
        const timeAgo = Math.round((Date.now() - action.timestamp) / 1000);
        const timeText = timeAgo < 60 ? `${timeAgo}s` : `${Math.round(timeAgo / 60)}m`;
        
        let actionText = "";
        if (action.action === 'MUTE_APPLIED') {
            const durationText = action.duration > 0 ? `${action.duration}min` : 'permanente';
            actionText = `🔇 MUTE: ${action.playerName} (ID:${action.playerId}) por ${durationText}`;
        } else if (action.action === 'MUTE_REMOVED') {
            actionText = `🔊 UNMUTE: ${action.playerName} (ID:${action.playerId})`;
        }
        
        window.gameRoom._room.sendAnnouncement(
            `${index + 1}. ${actionText}`,
            byPlayer.id,
            0x00AA00,
            "normal",
            0
        );
        
        window.gameRoom._room.sendAnnouncement(
            `   Razón: ${action.reason} | Hace: ${timeText}`,
            byPlayer.id,
            0x479947,
            "small",
            0
        );
        
        // Show expiration info for active mutes
        if (action.action === 'MUTE_APPLIED' && action.expireTime > 0) {
            const remaining = Math.max(0, Math.round((action.expireTime - Date.now()) / 60000));
            if (remaining > 0) {
                window.gameRoom._room.sendAnnouncement(
                    `   ⏰ Expira en: ${remaining} minutos`,
                    byPlayer.id,
                    0xFFD700,
                    "small",
                    0
                );
            } else {
                window.gameRoom._room.sendAnnouncement(
                    `   ✅ Ya expiró`,
                    byPlayer.id,
                    0x00AA00,
                    "small",
                    0
                );
            }
        }
    });

    // Show currently muted players
    const currentlyMuted = [];
    window.gameRoom.playerList.forEach((player, id) => {
        if (player.permissions.mute) {
            currentlyMuted.push({
                id: id,
                name: player.name,
                expireTime: player.permissions.muteExpire
            });
        }
    });

    if (currentlyMuted.length > 0) {
        window.gameRoom._room.sendAnnouncement("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", byPlayer.id, 0x5DADE2, "normal", 0);
        window.gameRoom._room.sendAnnouncement("🔇 JUGADORES MUTEADOS ACTUALMENTE:", byPlayer.id, 0xFF7777, "bold", 0);
        
        currentlyMuted.forEach(player => {
            let expireText = "permanente";
            if (player.expireTime > 0) {
                const remaining = Math.max(0, Math.round((player.expireTime - Date.now()) / 60000));
                expireText = remaining > 0 ? `${remaining}min restantes` : "expirado";
            }
            
            window.gameRoom._room.sendAnnouncement(
                `• ${player.name} (ID:${player.id}) - ${expireText}`,
                byPlayer.id,
                0xFF7777,
                "normal",
                0
            );
        });
    }
}

registerCommand("debugmute", cmdDebugMute, {
    helpText: "🔇 Muestra información de debug del sistema de mutes",
    category: "Admin Commands",
    adminOnly: true
});