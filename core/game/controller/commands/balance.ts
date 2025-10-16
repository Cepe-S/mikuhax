import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { BalanceMode } from "../balance/BalanceConfig";
import { CommandUtils } from "../utils/CommandUtils";

export function cmdBalance(byPlayer: PlayerObject, fullMessage?: string): void {
    if (!CommandUtils.requirePermission(byPlayer, 'admin')) return;
    
    const args = CommandUtils.parseArgs(fullMessage);
    const action = args[1];
    const value = args[2];

    if (!action) {
        const status = window.gameRoom.balanceManager.getStatus();
        const processingText = status.isProcessing ? ' [PROCESSING]' : '';
        const afkCount = Array.from(window.gameRoom.playerList.values())
            .filter(p => p.permissions.afkmode).length;
        const afkText = afkCount > 0 ? ` | AFK: ${afkCount}` : '';
        
        CommandUtils.sendSuccess(byPlayer.id,
            `⚖️ Balance: ${status.config.enabled ? 'ON' : 'OFF'} | Mode: ${status.config.mode.toUpperCase()} | Max/Team: ${status.config.maxPlayersPerTeam}${processingText}\n` +
            `Red: ${status.redCount} | Blue: ${status.blueCount} | Queue: ${status.queueLength}${afkText}`
        );
        return;
    }

    switch (action.toLowerCase()) {
        case "mode":
            if (value && (value === "jt" || value === "pro")) {
                window.gameRoom.balanceManager.setConfig({ mode: value as BalanceMode });
                CommandUtils.sendSuccess(byPlayer.id, `⚖️ Balance mode set to: ${value.toUpperCase()}`);
            } else {
                CommandUtils.sendError(byPlayer.id, "⚖️ Usage: !balance mode <jt|pro>");
            }
            break;
        case "max":
            const maxPlayers = parseInt(value);
            if (maxPlayers && maxPlayers > 0 && maxPlayers <= 10) {
                window.gameRoom.balanceManager.setConfig({ maxPlayersPerTeam: maxPlayers });
                CommandUtils.sendSuccess(byPlayer.id, `⚖️ Max players per team set to: ${maxPlayers}`);
            } else {
                CommandUtils.sendError(byPlayer.id, "⚖️ Usage: !balance max <1-10>");
            }
            break;
        case "toggle":
            const currentConfig = window.gameRoom.balanceManager.getConfig();
            window.gameRoom.balanceManager.setConfig({ enabled: !currentConfig.enabled });
            CommandUtils.sendSuccess(byPlayer.id, `⚖️ Balance system ${!currentConfig.enabled ? 'enabled' : 'disabled'}`);
            break;
        case "force":
            if (window.gameRoom.balanceManager.getConfig().mode === "pro") {
                window.gameRoom.balanceManager.forceRebalance();
                CommandUtils.sendSuccess(byPlayer.id, "⚖️ Forced rebalance from queue");
            } else {
                CommandUtils.sendError(byPlayer.id, "⚖️ Force rebalance only available in PRO mode");
            }
            break;
        default:
            CommandUtils.sendError(byPlayer.id, "⚖️ Usage: !balance [mode <jt|pro>] [max <number>] [toggle] [force]");
    }
}

registerCommand("balance", cmdBalance, {
    helpText: "⚖️ Configure team balance system. Usage: !balance [mode|max|toggle|force]",
    category: "Admin Commands"
});