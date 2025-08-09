import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { getTopByRangeFromDB } from "../Storage";
import { registerCommand } from "../CommandRegistry";

export async function cmdAsistidores(byPlayer: PlayerObject, message?: string): Promise<void> {
    let period: 'day' | 'month' | 'global' = 'global';

    // Parser passes the full chat message (e.g., '!asistidores dia').
    // Extract the first argument after the command name robustly.
    const tokens = (message || '').trim().split(/\s+/);
    const rawArg = tokens.length >= 2
        ? tokens[1]
        : (tokens[0] && !tokens[0].startsWith('!') ? tokens[0] : '');
    const arg = (rawArg || '').toLowerCase();
    if (arg === 'dia' || arg === 'día' || arg === 'day') period = 'day';
    else if (arg === 'mes' || arg === 'month') period = 'month';

    try {
        let from: number | undefined;
        let to: number | undefined;
        if (period === 'day') {
            const now = new Date();
            const arNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
            const start = new Date(arNow); start.setHours(0,0,0,0);
            from = start.getTime();
        } else if (period === 'month') {
            const now = new Date();
            const arNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
            const start = new Date(arNow); start.setDate(1); start.setHours(0,0,0,0);
            from = start.getTime();
        }
        const topAssisters = await getTopByRangeFromDB('assist', from, to, 5);

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

// Register the command
registerCommand("asistidores", cmdAsistidores, {
    helpText: "Ver top asistidores. Uso: !asistidores [dia|mes] (por defecto: global)",
    category: "Game Commands",
    requiresArgs: false
});