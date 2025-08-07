import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { TeamID } from "../../model/GameObject/TeamID";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdPoss(byPlayer: PlayerObject): void {
    let placeholder = {
        possTeamRed: window.gameRoom.ballStack.possCalculate(TeamID.Red)
        ,possTeamBlue: window.gameRoom.ballStack.possCalculate(TeamID.Blue),
    }
    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.poss, placeholder), byPlayer.id, 0x479947, "normal", 1);
}

// Register the command
registerCommand("poss", cmdPoss, {
    helpText: "⚽ Muestra la posesión de balón de cada equipo",
    category: "Game Commands"
});
