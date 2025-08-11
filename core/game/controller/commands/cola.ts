import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { QueueSystem } from "../../model/OperateHelper/QueueSystem";
import { registerCommand } from "../CommandRegistry";

export function cmdCola(byPlayer: PlayerObject, message?: string): void {
    const queueSystem = QueueSystem.getInstance();
    
    // Check if there are arguments for admin commands
    if (message && message.trim().length > 0) {
        const args = message.trim().split(' ');
        
        if (args[0].toLowerCase() === 'full' || args[0].toLowerCase() === 'completa') {
            queueSystem.showFullQueue(byPlayer.id);
            return;
        }
        
        if (args[0].toLowerCase() === 'debug') {
            const player = window.gameRoom.playerList.get(byPlayer.id);
            if (player && (player.admin || player.permissions.superadmin)) {
                queueSystem.debugStatus();
                window.gameRoom._room.sendAnnouncement(
                    "🔧 Estado del sistema de cola enviado al log del servidor",
                    byPlayer.id, 0x00AAFF, "normal", 1
                );
            } else {
                window.gameRoom._room.sendAnnouncement(
                    "❌ Solo los administradores pueden usar el debug",
                    byPlayer.id, 0xFF0000, "normal", 1
                );
            }
            return;
        }
    }
    
    // Show player's queue status
    queueSystem.showQueueStatus(byPlayer.id);
}

// Register the command
registerCommand('cola', cmdCola, {
    helpText: "🎯 Muestra tu posición en la cola de jugadores. Los admins pueden usar 'full' para ver la cola completa.",
    category: "Game Commands",
    requiresArgs: false,
    adminOnly: false
});

// Register aliases
registerCommand('queue', cmdCola, {
    helpText: "🎯 Muestra tu posición en la cola de jugadores (alias de !cola)",
    category: "Game Commands",
    requiresArgs: false,
    adminOnly: false
});

registerCommand('q', cmdCola, {
    helpText: "🎯 Muestra tu posición en la cola de jugadores (alias corto de !cola)",
    category: "Game Commands",
    requiresArgs: false,
    adminOnly: false
});
