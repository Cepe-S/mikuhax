import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getTopScorersGlobalFromDB, getTopScorersMonthlyFromDB, getTopScorersDailyFromDB } from "../Storage";

export async function cmdGoleadores(byPlayer: PlayerObject, message?: string): Promise<void> {
    let period: 'day' | 'month' | 'global' = 'global';
    
    if (message) {
        const arg = message.toLowerCase().trim();
        if (arg === 'dia' || arg === 'day') period = 'day';
        else if (arg === 'mes' || arg === 'month') period = 'month';
    }

    try {
        let topScorers: {playerAuth: string, playerName: string, count: number}[] = [];
        
        if (period === 'day') {
            topScorers = await getTopScorersDailyFromDB();
        } else if (period === 'month') {
            topScorers = await getTopScorersMonthlyFromDB();
        } else {
            topScorers = await getTopScorersGlobalFromDB();
        }

        let periodText = '';
        if (period === 'day') periodText = ' del día';
        else if (period === 'month') periodText = ' del mes';
        else periodText = ' de todos los tiempos';

        if (topScorers.length === 0) {
            window.gameRoom._room.sendAnnouncement(
                `⚽ No hay goleadores registrados${periodText}.`,
                byPlayer.id, 0x479947, "normal", 1
            );
            return;
        }

        let msg = `⚽ Top Goleadores${periodText}:\n`;
        topScorers.slice(0, 5).forEach((scorer, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            msg += `${medal} ${scorer.playerName}: ${scorer.count} goles\n`;
        });

        window.gameRoom._room.sendAnnouncement(msg.trim(), byPlayer.id, 0x479947, "normal", 1);
    } catch (error) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Error al obtener los goleadores.",
            byPlayer.id, 0xFF7777, "normal", 2
        );
    }
}