import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getTopAssistersGlobalFromDB, getTopAssistersMonthlyFromDB, getTopAssistersDailyFromDB } from "../Storage";

export async function cmdAsistidores(byPlayer: PlayerObject, message?: string): Promise<void> {
    let period: 'day' | 'month' | 'global' = 'global';
    
    if (message) {
        const arg = message.toLowerCase().trim();
        if (arg === 'dia' || arg === 'day') period = 'day';
        else if (arg === 'mes' || arg === 'month') period = 'month';
    }

    try {
        let topAssisters: {playerId: number, playerName: string, count: number}[] = [];
        
        if (period === 'day') {
            topAssisters = await getTopAssistersDailyFromDB();
        } else if (period === 'month') {
            topAssisters = await getTopAssistersMonthlyFromDB();
        } else {
            topAssisters = await getTopAssistersGlobalFromDB();
        }

        let periodText = '';
        if (period === 'day') periodText = ' del día';
        else if (period === 'month') periodText = ' del mes';
        else periodText = ' de todos los tiempos';

        if (topAssisters.length === 0) {
            window.gameRoom._room.sendAnnouncement(
                `🅰️ No hay asistidores registrados${periodText}.`,
                byPlayer.id, 0x479947, "normal", 1
            );
            return;
        }

        let msg = `🅰️ Top Asistidores${periodText}:\n`;
        topAssisters.slice(0, 5).forEach((assister, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            msg += `${medal} ${assister.playerName}: ${assister.count} asistencias\n`;
        });

        window.gameRoom._room.sendAnnouncement(msg.trim(), byPlayer.id, 0x479947, "normal", 1);
    } catch (error) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Error al obtener los asistidores.",
            byPlayer.id, 0xFF7777, "normal", 2
        );
    }
}