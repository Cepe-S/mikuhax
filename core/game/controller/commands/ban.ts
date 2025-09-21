import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBan(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("🚫 Ban system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("ban", cmdBan, {
    helpText: "🚫 Ban a player",
    category: "Admin Commands",
    adminOnly: true
});