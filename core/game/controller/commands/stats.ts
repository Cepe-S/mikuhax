import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { PlayerUtils } from "../utils/PlayerUtils";
import { CommandUtils } from "../utils/CommandUtils";
import { StatsUtils } from "../utils/StatsUtils";

export function cmdStats(byPlayer: PlayerObject, fullMessage?: string): void {
    const args = CommandUtils.parseArgs(fullMessage);
    const message = args[1];
    
    if (message !== undefined) {
        const targetId = PlayerUtils.parsePlayerId(message);
        if (targetId) {
            const placeholder = StatsUtils.getStatsPlaceholder(targetId);
            if (!placeholder) {
                CommandUtils.sendError(byPlayer.id, LangRes.command.stats._ErrorNoPlayer);
                return;
            }
            const resultMsg = StatsUtils.isOnMatchNow(targetId)
                ? Tst.maketext(LangRes.command.stats.statsMsg + '\n' + LangRes.command.stats.matchAnalysis, placeholder)
                : Tst.maketext(LangRes.command.stats.statsMsg, placeholder);
            CommandUtils.sendSuccess(byPlayer.id, resultMsg);
        } else {
            CommandUtils.sendError(byPlayer.id, LangRes.command.stats._ErrorNoPlayer);
        }
    } else {
        const placeholder = StatsUtils.getStatsPlaceholder(byPlayer.id);
        if (!placeholder) {
            CommandUtils.sendError(byPlayer.id, "Error al obtener estadísticas");
            return;
        }
        const resultMsg = StatsUtils.isOnMatchNow(byPlayer.id)
            ? Tst.maketext(LangRes.command.stats.statsMsg + '\n' + LangRes.command.stats.matchAnalysis, placeholder)
            : Tst.maketext(LangRes.command.stats.statsMsg, placeholder);
        CommandUtils.sendSuccess(byPlayer.id, resultMsg);
    }
}

// Register the command
registerCommand("stats", cmdStats, {
    helpText: "📊 Muestra las estadísticas de un jugador. Uso: !stats o !stats #ID",
    category: "Game Commands",
    requiresArgs: false
});
