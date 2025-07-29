import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { loadStadiumData } from "../../../lib/stadiumLoader";
import * as LangRes from "../../resource/strings";

export function cmdMap(byPlayer: PlayerObject, mapName?: string): void {
    // Verificar permisos de superadmin
    if (!window.gameRoom.playerList.get(byPlayer.id)?.permissions.superadmin) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Solo los superadministradores pueden cambiar el mapa.", 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        return;
    }

    // Si no se proporciona nombre de mapa, mostrar mapas disponibles
    if (!mapName) {
        const availableMaps = "🗺️ Mapas disponibles: futx2, futx3, futx4, futx5, futx7\n📑 Uso: !map <nombre_mapa>";
        window.gameRoom._room.sendAnnouncement(availableMaps, byPlayer.id, 0x479947, "normal", 1);
        return;
    }

    // Lista de mapas válidos
    const validMaps = ['futx2', 'futx3', 'futx4', 'futx5', 'futx7'];
    
    if (!validMaps.includes(mapName.toLowerCase())) {
        window.gameRoom._room.sendAnnouncement(
            `❌ Mapa "${mapName}" no encontrado. Mapas disponibles: ${validMaps.join(', ')}`, 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        return;
    }

    try {
        // Cargar el mapa
        const stadiumData = loadStadiumData(mapName.toLowerCase());
        window.gameRoom._room.setCustomStadium(stadiumData);
        
        // Notificar el cambio exitoso
        window.gameRoom._room.sendAnnouncement(
            `🗺️ ${byPlayer.name}#${byPlayer.id} cambió el mapa a: ${mapName}`, 
            null, 
            0x00FF00, 
            "normal", 
            1
        );
        
        // Log del cambio
        window.gameRoom.logger.i('cmdMap', `${byPlayer.name}#${byPlayer.id} changed map to ${mapName}`);
        
    } catch (error) {
        window.gameRoom._room.sendAnnouncement(
            `❌ Error al cargar el mapa "${mapName}". Inténtalo de nuevo.`, 
            byPlayer.id, 
            0xFF7777, 
            "normal", 
            2
        );
        
        window.gameRoom.logger.e('cmdMap', `Error loading map ${mapName}: ${error}`);
    }
}