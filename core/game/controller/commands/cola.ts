import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdCola(byPlayer: PlayerObject, message?: string): void {
    window.gameRoom._room.sendAnnouncement(
        "🎯 Sistema de cola no disponible actualmente",
        byPlayer.id, 0xFFD700, "normal", 1
    );
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
