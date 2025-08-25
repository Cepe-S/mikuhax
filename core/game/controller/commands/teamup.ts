import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

// Subteam data structure
interface Subteam {
    name: string;
    creator: string; // player name
    members: Set<string>; // player names
    invitations: Set<string>; // pending invitations by player name
    joinRequests: Set<string>; // pending join requests by player name
}

// Global subteams storage
const subteams = new Map<string, Subteam>();

// Utility functions
function normalizePlayerName(name: string): string {
    return name.toLowerCase().replace(/[_\s]/g, '');
}

function findPlayerByName(targetName: string): { player: PlayerObject; id: number } | null {
    const normalizedSearchName = normalizePlayerName(targetName);
    
    for (const [playerId, playerData] of window.gameRoom.playerList) {
        const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
        if (player && normalizePlayerName(player.name) === normalizedSearchName) {
            return { player, id: playerId };
        }
    }
    return null;
}

function getMaxSubteamSize(): number {
    return 3;
}

function getPlayerSubteam(playerName: string): Subteam | null {
    const normalizedName = normalizePlayerName(playerName);
    for (const subteam of subteams.values()) {
        for (const memberName of subteam.members) {
            if (normalizePlayerName(memberName) === normalizedName) {
                return subteam;
            }
        }
    }
    return null;
}

export function cmdTeamup(byPlayer: PlayerObject, message: string): void {
    const args = message.split(' ');
    const subcommand = args[1]?.toLowerCase();
    
    if (!subcommand) {
        window.gameRoom._room.sendAnnouncement(
            "🏆 Comandos teamup:\n" +
            "!teamup invite @jugador - Invitar jugador\n" +
            "!teamup join @jugador - Unirse al equipo\n" +
            "!teamup accept @jugador - Aceptar solicitud\n" +
            "!teamup list - Ver subequipos\n" +
            "!teamup leave - Salir del subequipo",
            byPlayer.id,
            0x00FFFF,
            "normal",
            1
        );
        return;
    }
    
    const playerData = window.gameRoom.playerList.get(byPlayer.id);
    if (!playerData) return;
    
    switch (subcommand) {
        case 'invite':
            handleInvite(byPlayer, args);
            break;
        case 'join':
            handleJoin(byPlayer, args);
            break;
        case 'accept':
            handleAccept(byPlayer, args);
            break;
        case 'list':
            handleList(byPlayer);
            break;
        case 'leave':
            handleLeave(byPlayer);
            break;
        default:
            window.gameRoom._room.sendAnnouncement(
                "❌ Subcomando inválido. Usa: invite, join, accept, list, leave",
                byPlayer.id,
                0xFF7777,
                "normal",
                2
            );
    }
}

function handleInvite(byPlayer: PlayerObject, args: string[]): void {
    if (args.length < 3 || !args[2].startsWith('@')) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Uso: !teamup invite @jugador",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    const targetName = args[2].substring(1);
    const targetInfo = findPlayerByName(targetName);
    
    if (!targetInfo) {
        window.gameRoom._room.sendAnnouncement(
            `❌ Jugador '${targetName}' no encontrado`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Check if trying to invite self
    if (normalizePlayerName(targetInfo.player.name) === normalizePlayerName(byPlayer.name)) {
        window.gameRoom._room.sendAnnouncement(
            "❌ No puedes invitarte a ti mismo",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Check if target is already in a subteam
    if (getPlayerSubteam(targetInfo.player.name)) {
        window.gameRoom._room.sendAnnouncement(
            `❌ ${targetInfo.player.name} ya está en un subequipo`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Get or create subteam
    let subteam = getPlayerSubteam(byPlayer.name);
    if (!subteam) {
        // Create new subteam with player's name
        const subteamName = byPlayer.name;
        subteam = {
            name: subteamName,
            creator: byPlayer.name,
            members: new Set([byPlayer.name]),
            invitations: new Set(),
            joinRequests: new Set()
        };
        subteams.set(subteamName, subteam);
        
        window.gameRoom._room.sendAnnouncement(
            `🏆 Subequipo '${subteamName}' creado`,
            byPlayer.id,
            0x479947,
            "normal",
            1
        );
    }
    
    // Check subteam size limit
    const maxSize = getMaxSubteamSize();
    if (subteam.members.size >= maxSize) {
        window.gameRoom._room.sendAnnouncement(
            `❌ El subequipo ha alcanzado el límite máximo (${maxSize} jugadores)`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Check if player is the creator
    if (normalizePlayerName(subteam.creator) !== normalizePlayerName(byPlayer.name)) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Solo el creador del subequipo puede invitar jugadores",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Add invitation
    subteam.invitations.add(targetInfo.player.name);
    
    window.gameRoom._room.sendAnnouncement(
        `📨 Has invitado a ${targetInfo.player.name} al subequipo '${subteam.name}'`,
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
    
    window.gameRoom._room.sendAnnouncement(
        `📨 ${byPlayer.name} te ha invitado al subequipo '${subteam.name}'. Usa !teamup join @${byPlayer.name} para unirte`,
        targetInfo.id,
        0xFF4500,
        "bold",
        1
    );
    
    window.gameRoom.logger.i('teamupInvite', `${byPlayer.name}#${byPlayer.id} invited ${targetInfo.player.name}#${targetInfo.id} to subteam '${subteam.name}'`);
}

function handleJoin(byPlayer: PlayerObject, args: string[]): void {
    if (args.length < 3 || !args[2].startsWith('@')) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Uso: !teamup join @jugador",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    const targetName = args[2].substring(1);
    const targetInfo = findPlayerByName(targetName);
    
    if (!targetInfo) {
        window.gameRoom._room.sendAnnouncement(
            `❌ Jugador '${targetName}' no encontrado`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    const targetSubteam = getPlayerSubteam(targetInfo.player.name);
    
    if (!targetSubteam) {
        window.gameRoom._room.sendAnnouncement(
            `❌ ${targetInfo.player.name} no tiene un subequipo`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Check subteam size limit
    const maxSize = getMaxSubteamSize();
    if (targetSubteam.members.size >= maxSize) {
        window.gameRoom._room.sendAnnouncement(
            `❌ El subequipo '${targetSubteam.name}' ha alcanzado el límite máximo (${maxSize} jugadores)`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Check if player has an invitation
    const hasInvitation = Array.from(targetSubteam.invitations).some(invitedName => 
        normalizePlayerName(invitedName) === normalizePlayerName(byPlayer.name)
    );
    
    if (hasInvitation) {
        // Remove from current subteam if in one
        const currentSubteam = getPlayerSubteam(byPlayer.name);
        if (currentSubteam) {
            currentSubteam.members.delete(byPlayer.name);
            // Clean up empty subteam
            if (currentSubteam.members.size === 0) {
                subteams.delete(currentSubteam.name);
            }
        }
        
        // Accept invitation directly
        targetSubteam.invitations = new Set(Array.from(targetSubteam.invitations).filter(name => 
            normalizePlayerName(name) !== normalizePlayerName(byPlayer.name)
        ));
        targetSubteam.members.add(byPlayer.name);
        
        window.gameRoom._room.sendAnnouncement(
            `🏆 Te has unido al subequipo '${targetSubteam.name}'`,
            byPlayer.id,
            0x479947,
            "normal",
            1
        );
        
        // Notify creator
        const creatorInfo = findPlayerByName(targetSubteam.creator);
        if (creatorInfo) {
            window.gameRoom._room.sendAnnouncement(
                `🏆 ${byPlayer.name} se ha unido al subequipo '${targetSubteam.name}'`,
                creatorInfo.id,
                0x479947,
                "normal",
                1
            );
        }
        
        window.gameRoom.logger.i('teamupJoin', `${byPlayer.name}#${byPlayer.id} joined subteam '${targetSubteam.name}' via invitation`);
    } else {
        // Check if player is already in a subteam (only for join requests)
        if (getPlayerSubteam(byPlayer.name)) {
            window.gameRoom._room.sendAnnouncement(
                "❌ Ya estás en un subequipo",
                byPlayer.id,
                0xFF7777,
                "normal",
                2
            );
            return;
        }
        
        // Check if already has a pending request
        const hasRequest = Array.from(targetSubteam.joinRequests).some(requestName => 
            normalizePlayerName(requestName) === normalizePlayerName(byPlayer.name)
        );
        
        if (hasRequest) {
            window.gameRoom._room.sendAnnouncement(
                "❌ Ya has enviado una solicitud a este subequipo",
                byPlayer.id,
                0xFF7777,
                "normal",
                2
            );
            return;
        }
        
        // Send join request
        targetSubteam.joinRequests.add(byPlayer.name);
        
        window.gameRoom._room.sendAnnouncement(
            `📨 Solicitud enviada al subequipo '${targetSubteam.name}'`,
            byPlayer.id,
            0x479947,
            "normal",
            1
        );
        
        // Notify creator
        const creatorInfo = findPlayerByName(targetSubteam.creator);
        if (creatorInfo) {
            window.gameRoom._room.sendAnnouncement(
                `📨 ${byPlayer.name} quiere unirse al subequipo '${targetSubteam.name}'. Usa !teamup accept @${byPlayer.name} para aceptar`,
                creatorInfo.id,
                0xFF4500,
                "bold",
                1
            );
        }
        
        window.gameRoom.logger.i('teamupRequest', `${byPlayer.name}#${byPlayer.id} requested to join subteam '${targetSubteam.name}'`);
    }
}

function handleAccept(byPlayer: PlayerObject, args: string[]): void {
    if (args.length < 3 || !args[2].startsWith('@')) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Uso: !teamup accept @jugador",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    const subteam = getPlayerSubteam(byPlayer.name);
    if (!subteam) {
        window.gameRoom._room.sendAnnouncement(
            "❌ No tienes un subequipo",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    if (normalizePlayerName(subteam.creator) !== normalizePlayerName(byPlayer.name)) {
        window.gameRoom._room.sendAnnouncement(
            "❌ Solo el creador del subequipo puede aceptar solicitudes",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    const targetName = args[2].substring(1);
    const targetInfo = findPlayerByName(targetName);
    
    if (!targetInfo) {
        window.gameRoom._room.sendAnnouncement(
            `❌ Jugador '${targetName}' no encontrado`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    const hasRequest = Array.from(subteam.joinRequests).some(requestName => 
        normalizePlayerName(requestName) === normalizePlayerName(targetInfo.player.name)
    );
    
    if (!hasRequest) {
        window.gameRoom._room.sendAnnouncement(
            `❌ ${targetInfo.player.name} no ha solicitado unirse al subequipo`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Check if target is already in a subteam
    if (getPlayerSubteam(targetInfo.player.name)) {
        window.gameRoom._room.sendAnnouncement(
            `❌ ${targetInfo.player.name} ya está en un subequipo`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        // Remove the request since they're already in a team
        subteam.joinRequests = new Set(Array.from(subteam.joinRequests).filter(name => 
            normalizePlayerName(name) !== normalizePlayerName(targetInfo.player.name)
        ));
        return;
    }
    
    // Check subteam size limit
    const maxSize = getMaxSubteamSize();
    if (subteam.members.size >= maxSize) {
        window.gameRoom._room.sendAnnouncement(
            `❌ El subequipo ha alcanzado el límite máximo (${maxSize} jugadores)`,
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Accept the request
    subteam.joinRequests = new Set(Array.from(subteam.joinRequests).filter(name => 
        normalizePlayerName(name) !== normalizePlayerName(targetInfo.player.name)
    ));
    subteam.members.add(targetInfo.player.name);
    
    window.gameRoom._room.sendAnnouncement(
        `🏆 Has aceptado a ${targetInfo.player.name} en el subequipo '${subteam.name}'`,
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
    
    window.gameRoom._room.sendAnnouncement(
        `🏆 Has sido aceptado en el subequipo '${subteam.name}'`,
        targetInfo.id,
        0x479947,
        "normal",
        1
    );
    
    window.gameRoom.logger.i('teamupAccept', `${byPlayer.name}#${byPlayer.id} accepted ${targetInfo.player.name}#${targetInfo.id} into subteam '${subteam.name}'`);
}

function handleList(byPlayer: PlayerObject): void {
    if (subteams.size === 0) {
        window.gameRoom._room.sendAnnouncement(
            "📝 No hay subequipos activos",
            byPlayer.id,
            0x00FFFF,
            "normal",
            1
        );
        return;
    }
    
    let message = "📝 Subequipos activos:\n";
    
    for (const [subteamName, subteam] of subteams) {
        const memberNames: string[] = Array.from(subteam.members);
        const maxSize = getMaxSubteamSize();
        message += `🏆 ${subteamName}: ${memberNames.join(", ")} (${subteam.members.size}/${maxSize})\n`;
        
        if (subteam.invitations.size > 0) {
            const inviteNames = Array.from(subteam.invitations);
            message += `  📨 Invitados: ${inviteNames.join(", ")}\n`;
        }
        
        if (subteam.joinRequests.size > 0) {
            const requestNames = Array.from(subteam.joinRequests);
            message += `  📫 Solicitudes: ${requestNames.join(", ")}\n`;
        }
    }
    
    window.gameRoom._room.sendAnnouncement(
        message.trim(),
        byPlayer.id,
        0x00FFFF,
        "normal",
        1
    );
}

function handleLeave(byPlayer: PlayerObject): void {
    const subteam = getPlayerSubteam(byPlayer.name);
    
    if (!subteam) {
        window.gameRoom._room.sendAnnouncement(
            "❌ No estás en ningún subequipo",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    
    // Remove player from subteam
    subteam.members = new Set(Array.from(subteam.members).filter(name => 
        normalizePlayerName(name) !== normalizePlayerName(byPlayer.name)
    ));
    
    window.gameRoom._room.sendAnnouncement(
        `🚪 Has salido del subequipo '${subteam.name}'`,
        byPlayer.id,
        0x479947,
        "normal",
        1
    );
    
    // Notify other members
    for (const memberName of subteam.members) {
        const memberInfo = findPlayerByName(memberName);
        if (memberInfo) {
            window.gameRoom._room.sendAnnouncement(
                `🚪 ${byPlayer.name} ha salido del subequipo '${subteam.name}'`,
                memberInfo.id,
                0xFFFF00,
                "normal",
                1
            );
        }
    }
    
    // If the creator left and there are still members, transfer ownership
    if (normalizePlayerName(subteam.creator) === normalizePlayerName(byPlayer.name) && subteam.members.size > 0) {
        const newCreatorName = subteam.members.values().next().value;
        subteam.creator = newCreatorName;
        
        const newCreatorInfo = findPlayerByName(newCreatorName);
        if (newCreatorInfo) {
            window.gameRoom._room.sendAnnouncement(
                `👑 ${newCreatorInfo.player.name} es ahora el líder del subequipo '${subteam.name}'`,
                null,
                0xFFD700,
                "normal",
                1
            );
        }
    }
    
    // Remove empty subteam
    if (subteam.members.size === 0) {
        subteams.delete(subteam.name);
        window.gameRoom.logger.i('teamupLeave', `Subteam '${subteam.name}' deleted - no members left`);
    }
    
    window.gameRoom.logger.i('teamupLeave', `${byPlayer.name}#${byPlayer.id} left subteam '${subteam.name}'`);
}

// Validate and maintain subteams integrity when players leave
export function validateSubteams(): void {
    const activePlayerNames = new Set<string>();
    
    // Get all active player names
    for (const [playerId, playerData] of window.gameRoom.playerList) {
        const player = window.gameRoom._room.getPlayerList().find(p => p.id === playerId);
        if (player) {
            activePlayerNames.add(player.name);
        }
    }
    
    // Clean up subteams
    for (const [subteamName, subteam] of subteams) {
        // Remove inactive members
        subteam.members = new Set(Array.from(subteam.members).filter(memberName => {
            return Array.from(activePlayerNames).some(activeName => 
                normalizePlayerName(activeName) === normalizePlayerName(memberName)
            );
        }));
        
        // Remove inactive invitations and requests
        subteam.invitations = new Set(Array.from(subteam.invitations).filter(inviteName => {
            return Array.from(activePlayerNames).some(activeName => 
                normalizePlayerName(activeName) === normalizePlayerName(inviteName)
            );
        }));
        
        subteam.joinRequests = new Set(Array.from(subteam.joinRequests).filter(requestName => {
            return Array.from(activePlayerNames).some(activeName => 
                normalizePlayerName(activeName) === normalizePlayerName(requestName)
            );
        }));
        
        // Check if creator is still active
        const creatorActive = Array.from(activePlayerNames).some(activeName => 
            normalizePlayerName(activeName) === normalizePlayerName(subteam.creator)
        );
        
        // If creator left but there are still members, transfer ownership
        if (!creatorActive && subteam.members.size > 0) {
            const newCreatorName = subteam.members.values().next().value;
            subteam.creator = newCreatorName;
        }
        
        // Remove only empty subteams
        if (subteam.members.size === 0) {
            subteams.delete(subteamName);
        }
    }
}

// Clear all subteams
export function clearAllSubteams(): void {
    subteams.clear();
    window.gameRoom.logger.i('teamup', 'All subteams cleared');
}

// Modified teamup command to check if system is enabled
export function cmdTeamupWrapper(byPlayer: PlayerObject, message: string): void {
    if (typeof (global as any).isTeamupEnabled === 'function' && !(global as any).isTeamupEnabled()) {
        window.gameRoom._room.sendAnnouncement(
            "❌ El sistema de subequipos está desactivado",
            byPlayer.id,
            0xFF7777,
            "normal",
            2
        );
        return;
    }
    cmdTeamup(byPlayer, message);
}

// Expose functions globally for integration with balance system
(global as any).getPlayerSubteam = (playerName: string) => {
    if (typeof (global as any).isTeamupEnabled === 'function' && !(global as any).isTeamupEnabled()) {
        return null;
    }
    return getPlayerSubteam(playerName);
};
(global as any).getSubteams = () => {
    if (typeof (global as any).isTeamupEnabled === 'function' && !(global as any).isTeamupEnabled()) {
        return new Map();
    }
    return subteams;
};
(global as any).cleanupSubteams = validateSubteams;

// Export functions for better integration
export { getPlayerSubteam };

// Register the command
registerCommand("teamup", cmdTeamupWrapper, {
    helpText: "🏆 Sistema de subequipos: invite, join, accept, list, leave",
    category: "Game Commands",
    requiresArgs: false
});