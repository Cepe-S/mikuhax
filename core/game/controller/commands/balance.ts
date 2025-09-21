import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBalance(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("⚖️ Balance system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("balance", cmdBalance, {
    helpText: "⚖️ Balance system not implemented",
    category: "Admin Commands",
    adminOnly: true
});