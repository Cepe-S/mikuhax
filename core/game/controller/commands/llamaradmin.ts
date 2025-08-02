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
    window.gameRoom.logger.i('llamaradmin', `${byPlayer.name}#${byPlayer.id} llamó a un admin. Razón: ${reason}`);
    
    // Debug: Log webhook configuration
    const webhookConfig = window.gameRoom.social?.discordWebhook;
    window.gameRoom.logger.i('llamaradmin', `Webhook config - AdminCallUrl: ${webhookConfig?.adminCallUrl ? 'configured' : 'not configured'}`);
    
    // Enviar webhook a Discord solo si adminCallUrl está configurado
    if (webhookConfig?.adminCallUrl) {
        const webhookContent = {
            ruid: window.gameRoom.config._RUID,
            roomName: window.gameRoom.config._config.roomName,
            roomLink: window.gameRoom.link,
            reason: reason,
            callerName: byPlayer.name,
            callerId: byPlayer.id
        };
        
        try {
            window._feedSocialDiscordWebhook(
                '', // Empty string - let the function determine the correct URL
                'admin_call',
                webhookContent
            );
            window.gameRoom.logger.i('llamaradmin', 'Webhook enviado correctamente');
        } catch (error) {
            window.gameRoom.logger.e('llamaradmin', `Error enviando webhook: ${error}`);
        }
    } else {
        window.gameRoom.logger.w('llamaradmin', 'Admin call webhook no configurado.');
        window.gameRoom.logger.i('llamaradmin', 'Para habilitar webhooks de admin calls, configura adminCallUrl en la Server Image.');
        
        // Mensaje adicional al usuario si el webhook no está configurado
        window.gameRoom._room.sendAnnouncement(
            "⚠️ Nota: El webhook de Discord no está configurado para llamadas de admin. Tu llamado se ha registrado en los logs.",
            byPlayer.id,
            0xFFAA00,
            "normal",
            1
        );
    }
}