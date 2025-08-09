import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmdNv(byPlayer: PlayerObject, message?: string): void {
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
        `👋 ${byPlayer.name} se despide. ¡Nos vemos pronto!`,
        null,
        0x00FF00,
        "normal",
        1
    );

    // Log the voluntary leave
    window.gameRoom.logger.i('cmdNv', `${byPlayer.name}#${byPlayer.id} used !nv command to leave voluntarily`);

    // Kick the player with a friendly message
    setTimeout(() => {
        window.gameRoom._room.kickPlayer(
            byPlayer.id,
            "👋 ¡Hasta la vista! Usado comando !nv",
            false
        );
    }, 1000); // Small delay to ensure the announcement is sent first
}

// Register the command
registerCommand("nv", cmdNv, {
    helpText: "👋 Te despides y sales del servidor. Uso: !nv",
    category: "Basic Commands",
    requiresArgs: false
});
