import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdAvatar(player: PlayerObject, message: string): void {
    if (!player) return;

    const args = message.split(' ').slice(1);
    if (args.length < 1) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Uso: !avatar <1-2 caracteres>", 
            player.id, 
            0xFF0000, 
            "normal", 
            0
        );
        return;
    }

    const newAvatar = args[0];
    
    if (newAvatar.length < 1 || newAvatar.length > 2) {
        window.gameRoom._room.sendAnnouncement(
            "❌ El avatar debe tener entre 1 y 2 caracteres", 
            player.id, 
            0xFF0000, 
            "normal", 
            0
        );
        return;
    }

    window.gameRoom._room.setPlayerAvatar(player.id, newAvatar);
    
    window.gameRoom._room.sendAnnouncement(
        `✅ Avatar cambiado a: ${newAvatar}`, 
        player.id, 
        0x00FF00, 
        "normal", 
        0
    );
}