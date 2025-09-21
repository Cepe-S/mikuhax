import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdUnmute(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("🔊 Unmute system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("unmute", cmdUnmute, {
    helpText: "🔊 Unmute a player",
    category: "Admin Commands",
    adminOnly: true
});