import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { setRandomStadium, rotateStadium } from "../RoomTools";
import { registerCommand } from "../CommandRegistry";

export function cmdRandomStadium(byPlayer: PlayerObject, message: string): void {
    // Check if player has admin permissions
    if (!window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin && !window.gameRoom.playerList.get(byPlayer.id)?.admin) {
        window.gameRoom._room.sendAnnouncement(
            "🚫 Solo los administradores pueden usar este comando.", 
            byPlayer.id, 
            0xFF6347, 
            "normal", 
            1
        );
        return;
    }

    // Change to random stadium
    if (setRandomStadium()) {
        window.gameRoom._room.sendAnnouncement(
            `✅ ${byPlayer.name} cambió el estadio aleatoriamente.`,
            null,
            0x00FF00,
            "bold",
            1
        );
    } else {
        window.gameRoom._room.sendAnnouncement(
            "❌ Error al cambiar el estadio.",
            byPlayer.id,
            0xFF6347,
            "normal",
            1
        );
    }
}

export function cmdRotateStadium(byPlayer: PlayerObject, message: string): void {
    // Check if player has admin permissions
    if (!window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin && !window.gameRoom.playerList.get(byPlayer.id)?.admin) {
        window.gameRoom._room.sendAnnouncement(
            "🚫 Solo los administradores pueden usar este comando.", 
            byPlayer.id, 
            0xFF6347, 
            "normal", 
            1
        );
        return;
    }

    // Rotate to next stadium
    if (rotateStadium()) {
        window.gameRoom._room.sendAnnouncement(
            `✅ ${byPlayer.name} rotó el estadio.`,
            null,
            0x00FF00,
            "bold",
            1
        );
    } else {
        window.gameRoom._room.sendAnnouncement(
            "❌ Error al rotar el estadio.",
            byPlayer.id,
            0xFF6347,
            "normal",
            1
        );
    }
}

// Register the commands
registerCommand("randomstadium", cmdRandomStadium, {
    helpText: "Cambiar a estadio aleatorio. Uso: !randomstadium",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});

registerCommand("rs", cmdRandomStadium, {
    helpText: "Cambiar a estadio aleatorio (alias). Uso: !rs",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});

registerCommand("rotatestadium", cmdRotateStadium, {
    helpText: "Rotar al siguiente estadio. Uso: !rotatestadium",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});

registerCommand("rotate", cmdRotateStadium, {
    helpText: "Rotar al siguiente estadio (alias). Uso: !rotate",
    category: "Admin Commands",
    requiresArgs: false,
    adminOnly: true
});