import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdPowershotAdmin(byPlayer: PlayerObject, message: string): void {
    // Check if player has admin permissions
    if (!window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(
            "🚫 Solo los administradores pueden usar este comando.", 
            byPlayer.id, 
            0xFF6347, 
            "normal", 
            1
        );
        return;
    }

    const args = message.split(' ');
    if (args.length < 2) {
        window.gameRoom._room.sendAnnouncement(
            "📋 Uso: !powershotadmin <on|off>\n" +
            "- on: Activa el sistema de powershot automático\n" +
            "- off: Desactiva el sistema de powershot", 
            byPlayer.id, 
            0x00BFFF, 
            "normal", 
            1
        );
        return;
    }

    const action = args[1].toLowerCase();
    
    if (action === 'on' || action === 'activar') {
        if (window.gameRoom.config.settings.powershotEnabled) {
            window.gameRoom._room.sendAnnouncement(
                "ℹ️ El sistema de powershot ya está activado.", 
                byPlayer.id, 
                0xFFD700, 
                "normal", 
                1
            );
            return;
        }

        window.gameRoom.config.settings.powershotEnabled = true;
        
        window.gameRoom._room.sendAnnouncement(
            "✅ Sistema de POWERSHOT ACTIVADO por " + byPlayer.name + "#" + byPlayer.id + "\n" +
            "⚡ Los jugadores ahora pueden activar powershot automáticamente al mantener la pelota.", 
            null, 
            0x00FF00, 
            "bold", 
            2
        );
        
        window.gameRoom.logger.i('powershotadmin', `${byPlayer.name}#${byPlayer.id} enabled powershot system`);
        
    } else if (action === 'off' || action === 'desactivar') {
        if (!window.gameRoom.config.settings.powershotEnabled) {
            window.gameRoom._room.sendAnnouncement(
                "ℹ️ El sistema de powershot ya está desactivado.", 
                byPlayer.id, 
                0xFFD700, 
                "normal", 
                1
            );
            return;
        }

        window.gameRoom.config.settings.powershotEnabled = false;
        
        // Reset any active powershot
        window.gameRoom.ballStack.resetPowershot();
        
        window.gameRoom._room.sendAnnouncement(
            "❌ Sistema de POWERSHOT DESACTIVADO por " + byPlayer.name + "#" + byPlayer.id + "\n" +
            "🔒 Los jugadores ya no pueden usar powershot.", 
            null, 
            0xFF4500, 
            "bold", 
            2
        );
        
        window.gameRoom.logger.i('powershotadmin', `${byPlayer.name}#${byPlayer.id} disabled powershot system`);
        
    } else {
        window.gameRoom._room.sendAnnouncement(
            "❌ Parámetro inválido. Usa 'on' para activar o 'off' para desactivar.", 
            byPlayer.id, 
            0xFF6347, 
            "normal", 
            1
        );
    }
}
