import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdUnban(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("✅ Unban system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("unban", cmdUnban, {
    helpText: "✅ Unban a player",
    category: "Admin Commands",
    adminOnly: true
});