import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdMute(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("🔇 Mute system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("mute", cmdMute, {
    helpText: "🔇 Mute a player",
    category: "Admin Commands",
    adminOnly: true
});