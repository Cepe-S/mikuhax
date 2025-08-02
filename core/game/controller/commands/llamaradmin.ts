import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as Tst from "../Translator";

export function cmdLlamarAdmin(byPlayer: PlayerObject, message?: string): void {
    const reason = message || "Sin razón especificada";
    
    // Mensaje de confirmación solo para el usuario que llamó
    const confirmationMsg = `✅ Tu llamado al administrador ha sido enviado. \nRazón: ${reason}`;
    
    // Enviar confirmación solo al usuario que hizo el llamado (celeste claro)
    window.gameRoom._room.sendAnnouncement(
        confirmationMsg,
        byPlayer.id, // Solo al usuario que llamó
        0x87CEEB, // Celeste claro
        "normal", 
        1
    );
    
    // Log del evento para administradores
    window.gameRoom.logger.i('llamaradmin', `${byPlayer.name}#${byPlayer.id} llamó a un admin. \nRazón: ${reason}`);
    
    // Enviar webhook a Discord si está configurado
    const adminCallUrl = window.gameRoom.social?.discordWebhook?.adminCallUrl;
    if (adminCallUrl && window.gameRoom.social.discordWebhook.feed) {
        const webhookContent = {
            ruid: window.gameRoom.config._RUID,
            roomName: window.gameRoom.config._config.roomName,
            roomLink: window.gameRoom.link,
            reason: reason,
            callerName: byPlayer.name,
            callerId: byPlayer.id
        };
        
        window._feedSocialDiscordWebhook(
            '', // Empty string - let the function determine the correct URL
            'admin_call',
            webhookContent
        );
    }
}