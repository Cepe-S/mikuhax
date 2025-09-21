import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdAfk(byPlayer: PlayerObject, message?: string): void {
    window.gameRoom._room.sendAnnouncement("💤 AFK system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("afk", cmdAfk, {
    helpText: "💤 AFK system not implemented",
    category: "Basic Commands"
});
