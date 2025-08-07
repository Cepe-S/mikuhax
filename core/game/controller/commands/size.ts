import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdSize(byPlayer: PlayerObject, message?: string): void {
    // Parsear el mensaje para extraer el tamaño
    let targetSize: number | undefined;
    if (message) {
        const args = message.trim().split(" ");
        if (args.length > 1) {
            const sizeArg = args[1];
            const parsedSize = parseInt(sizeArg, 10);
            if (!isNaN(parsedSize)) {
                targetSize = parsedSize;
            }
        }
    }

    // Si no se proporciona tamaño válido, mostrar ayuda
    if (targetSize === undefined) {
        window.gameRoom._room.sendAnnouncement(
            "📏 Uso: !size <8-15>\n💡 Cambia tu tamaño de jugador (solo una vez por partido)", 
            byPlayer.id, 
            0x00BFFF, 
            "normal", 
            1
        );
        return;
    }

    // Validar rango de tamaño
    if (targetSize < 8 || targetSize > 15) {
        window.gameRoom._room.sendAnnouncement(
            "❌ El tamaño debe estar entre 8 y 15.", 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        return;
    }

    // Verificar si el jugador ya usó el comando en este partido
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Error al obtener datos del jugador.", 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        return;
    }

    // Inicializar la propiedad si no existe
    if (!playerData.hasOwnProperty('sizeUsedThisMatch')) {
        (playerData as any).sizeUsedThisMatch = false;
    }

    // Verificar si ya fue usado
    if ((playerData as any).sizeUsedThisMatch) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Ya usaste el comando !size en este partido.", 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        return;
    }

    try {
        // Cambiar el tamaño del jugador usando setPlayerDiscProperties
        window.gameRoom._room.setPlayerDiscProperties(byPlayer.id, {
            radius: targetSize
        });
        
        // Marcar como usado en este partido
        (playerData as any).sizeUsedThisMatch = true;
        
        // Notificar el cambio exitoso
        window.gameRoom._room.sendAnnouncement(
            `📏 ${byPlayer.name} cambió su tamaño a ${targetSize}`, 
            null, 
            0x00FF00, 
            "normal", 
            1
        );
        
        // Log del cambio
        window.gameRoom.logger.i('cmdSize', `${byPlayer.name}#${byPlayer.id} changed size to ${targetSize}`);
        
    } catch (error) {
        window.gameRoom._room.sendAnnouncement(
            `❌ Error al cambiar el tamaño. Inténtalo de nuevo.`, 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        
        window.gameRoom.logger.e('cmdSize', `Error changing size for ${byPlayer.name}: ${error}`);
    }
}

// Register the command
registerCommand("size", cmdSize, {
    helpText: "Cambiar tamaño de jugador (8-15). Uso: !size <tamaño>",
    category: "Game Commands",
    requiresArgs: false
});