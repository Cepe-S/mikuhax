import { PlayerObject } from "../../model/GameObject/PlayerObject";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { registerCommand } from "../CommandRegistry";

export function cmdTier(byPlayer: PlayerObject, message?: string): void {
    const placeholder = {
        placementMatches: '10',
        tierCutoff1: '400',
        tierCutoff2: '800', 
        tierCutoff3: '1200',
        tierCutoff4: '1600',
        tierCutoff5: '2000',
        tierCutoff6: '2400',
        tierCutoff7: '2800'
    };
    
    window.gameRoom._room.sendAnnouncement(
        Tst.maketext(LangRes.command.tier, placeholder),
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
}

registerCommand("tier", cmdTier, {
    helpText: "🏆 Muestra información sobre el sistema de tiers y ranking",
    category: "Basic Commands"
});