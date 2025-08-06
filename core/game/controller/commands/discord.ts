import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdDiscord(byPlayer: PlayerObject): void {
    // Send Discord server invitation message
    window.gameRoom._room.sendAnnouncement(
        `🔗 ¡Únete a nuestro servidor de Discord! 
💬 Comunidad activa, eventos, torneos y mucho más
🎮 Link: https://discord.gg/qfg45B2
📢 ¡Te esperamos!`,
        byPlayer.id,
        0x7289DA,
        "normal",
        1
    );
}
