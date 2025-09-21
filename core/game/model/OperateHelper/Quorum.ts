// Minimal stub functions
import { TeamID } from "../GameObject/TeamID";

export function roomActivePlayersNumberCheck(): number {
    let count = 0;
    window.gameRoom.playerList.forEach(player => {
        if (player.team !== TeamID.Spec) {
            count++;
        }
    });
    return count;
}