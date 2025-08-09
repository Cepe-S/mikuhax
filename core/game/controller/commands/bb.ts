import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdBb(byPlayer: PlayerObject, message?: string): void {
    const placeholder = {
        targetName: byPlayer.name,
        targetID: byPlayer.id,
        gameRuleName: window.gameRoom.config.rules.ruleName,
        gameRuleLimitTime: window.gameRoom.config.rules.requisite.timeLimit,
        gameRuleLimitScore: window.gameRoom.config.rules.requisite.scoreLimit,
        gameRuleNeedMin: window.gameRoom.config.rules.requisite.minimumPlayers
    };

    // Send farewell message to all players
    window.gameRoom._room.sendAnnouncement(
        `👋 ${byPlayer.name} dice bye bye. ¡Que tengas un buen día!`,
        null,
        0x00BFFF,
        "normal",
        1
    );

    // Log the voluntary leave
    window.gameRoom.logger.i('cmdBb', `${byPlayer.name}#${byPlayer.id} used !bb command to leave voluntarily`);

    // Kick the player with a friendly message
    setTimeout(() => {
        window.gameRoom._room.kickPlayer(
            byPlayer.id,
            "👋 ¡Bye bye! Usado comando !bb",
            false
        );
    }, 1000); // Small delay to ensure the announcement is sent first
}

// Register the command
registerCommand("bb", cmdBb, {
    helpText: "👋 Dices bye bye y sales del servidor. Uso: !bb",
    category: "Basic Commands",
    requiresArgs: false
});
