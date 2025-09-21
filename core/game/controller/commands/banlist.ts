import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBanlist(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("📋 Ban list not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("banlist", cmdBanlist, {
    helpText: "📋 Show banned players",
    category: "Admin Commands",
    adminOnly: true
});