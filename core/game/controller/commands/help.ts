import * as LangRes from "../../resource/strings";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { CommandRegistry } from "../CommandRegistry";
import { registerCommand } from "../CommandRegistry";

export function cmdHelp(byPlayer: PlayerObject, fullMessage?: string): void {
    // Parse the full message to extract the target command
    const msgChunk = fullMessage ? fullMessage.split(" ") : [];
    const message = msgChunk[1]; // first argument after command
    
    if(message !== undefined) {
        // 🆕 Check if it's a registered command first
        const registeredCommand = CommandRegistry.get(message);
        if (registeredCommand) {
            window.gameRoom._room.sendAnnouncement(
                `📋 ${registeredCommand.meta.helpText}`,
                byPlayer.id,
                0x479947,
                "normal",
                1
            );
            return;
        }

        // Fallback to legacy help system
        switch(message) {
            case window.gameRoom.config.commands._helpManabout: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.about, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManhelp: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.help, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManstats: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.stats, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManstatsreset: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.statsreset, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManstreak: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.streak, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManscout: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.scout, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManposs: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.poss, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManafk: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.afk, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManlist: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.list, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManfreeze: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.freeze, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManmute: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.mute, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManvote: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.vote, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpMantier: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.tier, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpMannotice: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.notice, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManpowershotadmin: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.powershotadmin, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpMangoleadores: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.goleadores, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManmemide: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.memide, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpMannv: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.nv, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            case window.gameRoom.config.commands._helpManbb: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman.bb, byPlayer.id, 0x479947, "normal", 1);
                break;
            }
            default: {
                window.gameRoom._room.sendAnnouncement(LangRes.command.helpman._ErrorWrongMan, byPlayer.id, 0xFF7777, "normal", 2);
                break;
            }
        }
    } else {
        // Generate dynamic help including registered commands
        let helpMessage = "📋 COMANDOS DISPONIBLES:\n";
        
        // Add registered commands to help
        const registeredCommands = CommandRegistry.getAllByCategory();
        Object.keys(registeredCommands).forEach(category => {
            if (registeredCommands[category].length > 0) {
                helpMessage += `\n📂 ${category}:\n`;
                registeredCommands[category].forEach(cmd => {
                    helpMessage += `!${cmd.meta.name} - ${cmd.meta.helpText}\n`;
                });
            }
        });
        
        window.gameRoom._room.sendAnnouncement(helpMessage, byPlayer.id, 0x479947, "normal", 1);
    }
}

// Register the command
registerCommand("help", cmdHelp, {
    helpText: "❓ Muestra la lista de comandos disponibles o información específica de un comando",
    category: "Basic Commands",
    requiresArgs: false
});
