import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdVote(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("🗳️ Voting system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("vote", cmdVote, {
    helpText: "🗳️ Vote for something",
    category: "Game Commands"
});