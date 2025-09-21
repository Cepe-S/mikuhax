import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdRanking(byPlayer: PlayerObject, message: string): void {
    window.gameRoom._room.sendAnnouncement("📊 Ranking system not implemented yet.", byPlayer.id, 0xFFFFFF, "normal", 1);
}

registerCommand("ranking", cmdRanking, {
    helpText: "📊 Show player rankings",
    category: "Basic Commands"
});