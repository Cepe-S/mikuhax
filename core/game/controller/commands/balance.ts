import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";
import { BalanceMode } from "../balance/BalanceConfig";

export function cmdBalance(byPlayer: PlayerObject, fullMessage?: string): void {
    const msgChunk = fullMessage ? fullMessage.split(" ") : [];
    const action = msgChunk[1];
    const value = msgChunk[2];

    if (!action) {
        const status = window.gameRoom.balanceManager.getStatus();
        const processingText = status.isProcessing ? ' [PROCESSING]' : '';
        
        // Count AFK players
        let afkCount = 0;
        for (const [playerId, playerData] of window.gameRoom.playerList) {
            if (playerData.permissions.afkmode) afkCount++;
        }
        
        const afkText = afkCount > 0 ? ` | AFK: ${afkCount}` : '';
        
        window.gameRoom._room.sendAnnouncement(
            `⚖️ Balance: ${status.config.enabled ? 'ON' : 'OFF'} | Mode: ${status.config.mode.toUpperCase()} | Max/Team: ${status.config.maxPlayersPerTeam}${processingText}\n` +
            `Red: ${status.redCount} | Blue: ${status.blueCount} | Queue: ${status.queueLength}${afkText}`,
            byPlayer.id, 0x00AA00, "normal", 1
        );
        return;
    }

    switch (action.toLowerCase()) {
        case "mode":
            if (value && (value === "jt" || value === "pro")) {
                window.gameRoom.balanceManager.setConfig({ mode: value as BalanceMode });
                window.gameRoom._room.sendAnnouncement(`⚖️ Balance mode set to: ${value.toUpperCase()}`, byPlayer.id, 0x00AA00, "normal", 1);
            } else {
                window.gameRoom._room.sendAnnouncement("⚖️ Usage: !balance mode <jt|pro>", byPlayer.id, 0xFF7777, "normal", 2);
            }
            break;
        case "max":
            const maxPlayers = parseInt(value);
            if (maxPlayers && maxPlayers > 0 && maxPlayers <= 10) {
                window.gameRoom.balanceManager.setConfig({ maxPlayersPerTeam: maxPlayers });
                window.gameRoom._room.sendAnnouncement(`⚖️ Max players per team set to: ${maxPlayers}`, byPlayer.id, 0x00AA00, "normal", 1);
            } else {
                window.gameRoom._room.sendAnnouncement("⚖️ Usage: !balance max <1-10>", byPlayer.id, 0xFF7777, "normal", 2);
            }
            break;
        case "toggle":
            const currentConfig = window.gameRoom.balanceManager.getConfig();
            window.gameRoom.balanceManager.setConfig({ enabled: !currentConfig.enabled });
            window.gameRoom._room.sendAnnouncement(`⚖️ Balance system ${!currentConfig.enabled ? 'enabled' : 'disabled'}`, byPlayer.id, 0x00AA00, "normal", 1);
            break;
        case "force":
            if (window.gameRoom.balanceManager.getConfig().mode === "pro") {
                window.gameRoom.balanceManager.forceRebalance();
                window.gameRoom._room.sendAnnouncement("⚖️ Forced rebalance from queue", byPlayer.id, 0x00AA00, "normal", 1);
            } else {
                window.gameRoom._room.sendAnnouncement("⚖️ Force rebalance only available in PRO mode", byPlayer.id, 0xFF7777, "normal", 2);
            }
            break;
        default:
            window.gameRoom._room.sendAnnouncement("⚖️ Usage: !balance [mode <jt|pro>] [max <number>] [toggle] [force]", byPlayer.id, 0xFF7777, "normal", 2);
    }
}

registerCommand("balance", cmdBalance, {
    helpText: "⚖️ Configure team balance system. Usage: !balance [mode|max|toggle|force]",
    category: "Admin Commands",
    adminOnly: true
});