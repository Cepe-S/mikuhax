import { PlayerObject } from "../model/GameObject/PlayerObject";

interface PlayerSpamTracker {
    messages: number[];        // Solo timestamps para eficiencia
    lastCleanup: number;      // Última limpieza para evitar cleanup constante
    recentMessages: string[]; // Últimos mensajes para logging
}

interface AntiSpamLog {
    timestamp: number;
    playerId: number;
    playerName: string;
    playerAuth: string;
    reason: "chat_flood";
    messages: string[];
    muteTimeMinutes: number;
    muteEnd: number;
}

export class ChatFloodManager {
    private trackers = new Map<number, PlayerSpamTracker>();
    private lastGlobalCleanup = 0;
    private readonly CLEANUP_INTERVAL = 30000; // Cleanup cada 30s
    private antiSpamLogs: AntiSpamLog[] = [];

    /**
     * Verifica si un mensaje debe ser bloqueado por spam
     */
    checkMessage(player: PlayerObject, message: string): boolean {
        const settings = window.gameRoom.config.settings;
        
        // Si el sistema está desactivado, permitir mensaje
        if (!settings.antiChatFlood || !settings.antiSpamMuteEnabled) {
            return true;
        }

        // Los admins no están sujetos al antispam
        const playerData = window.gameRoom.playerList.get(player.id);
        if (player.admin || (playerData && playerData.permissions.superadmin)) {
            return true;
        }

        const currentTime = Date.now();
        
        // Cleanup global periódico
        this.globalCleanup(currentTime);
        
        // Verificar spam para este jugador específico
        const isSpam = !this.checkMessageCount(player.id, message, currentTime);
        
        if (isSpam) {
            this.applyMute(player);
            return false;
        }
        
        return true;
    }

    /**
     * Verifica el conteo de mensajes para un jugador
     */
    private checkMessageCount(playerId: number, message: string, currentTime: number): boolean {
        const settings = window.gameRoom.config.settings;
        const windowSize = settings.chatFloodIntervalMillisecs;
        const maxMessages = settings.chatFloodCriterion;
        
        // Obtener o crear tracker
        let tracker = this.trackers.get(playerId);
        if (!tracker) {
            tracker = { 
                messages: [], 
                lastCleanup: currentTime,
                recentMessages: []
            };
            this.trackers.set(playerId, tracker);
        }
        
        // Limpieza eficiente (solo si es necesario)
        if (currentTime - tracker.lastCleanup > windowSize) {
            const cutoff = currentTime - windowSize;
            tracker.messages = tracker.messages.filter(t => t > cutoff);
            tracker.lastCleanup = currentTime;
            
            // Limpiar mensajes antiguos también
            tracker.recentMessages = tracker.recentMessages.slice(-maxMessages);
        }
        
        // Agregar mensaje actual
        tracker.messages.push(currentTime);
        tracker.recentMessages.push(message);
        
        // Mantener solo los mensajes recientes necesarios
        if (tracker.recentMessages.length > maxMessages) {
            tracker.recentMessages = tracker.recentMessages.slice(-maxMessages);
        }
        
        // Verificar límite
        return tracker.messages.length <= maxMessages;
    }

    /**
     * Aplica muteo automático por spam
     */
    private applyMute(player: PlayerObject): void {
        const settings = window.gameRoom.config.settings;
        const playerData = window.gameRoom.playerList.get(player.id);
        
        if (!playerData) return;

        const muteTime = settings.antiSpamMuteTimeMillisecs;
        const muteEnd = Date.now() + muteTime;
        
        // Aplicar muteo
        playerData.permissions.mute = true;
        playerData.permissions.muteExpire = muteEnd;
        
        // Obtener mensajes que causaron el spam
        const tracker = this.trackers.get(player.id);
        const spamMessages = tracker ? tracker.recentMessages.slice() : [];
        
        // Notificar al jugador
        const muteMinutes = Math.round(muteTime / 60000);
        window.gameRoom._room.sendAnnouncement(
            `🔇 Has sido muteado automáticamente por ${muteMinutes} minutos por spam.`,
            player.id,
            0xFF7777,
            "bold",
            2
        );
        
        // Log del evento
        if (settings.antiSpamMuteLogEnabled) {
            this.logAntiSpamEvent(player, spamMessages, muteTime, muteEnd);
        }
        
        // Log en consola
        window.gameRoom.logger.i('antiSpam', 
            `Player ${player.name}#${player.id} muted for ${muteMinutes}min (spam detection)`
        );
        
        // Guardar en base de datos
        window._insertMuteByAuthDB(
            window.gameRoom.config._RUID,
            player.auth,
            muteEnd,
            `Auto-mute: spam detection (${muteMinutes}min)`
        );
    }

    /**
     * Registra evento de antispam para debug
     */
    private logAntiSpamEvent(player: PlayerObject, messages: string[], muteTime: number, muteEnd: number): void {
        const log: AntiSpamLog = {
            timestamp: Date.now(),
            playerId: player.id,
            playerName: player.name,
            playerAuth: player.auth,
            reason: "chat_flood",
            messages: messages,
            muteTimeMinutes: Math.round(muteTime / 60000),
            muteEnd: muteEnd
        };
        
        this.antiSpamLogs.push(log);
        
        // Mantener solo los últimos 100 logs
        if (this.antiSpamLogs.length > 100) {
            this.antiSpamLogs = this.antiSpamLogs.slice(-100);
        }
    }

    /**
     * Cleanup global periódico para optimizar memoria
     */
    private globalCleanup(currentTime: number): void {
        if (currentTime - this.lastGlobalCleanup < this.CLEANUP_INTERVAL) return;
        
        const cutoff = currentTime - window.gameRoom.config.settings.chatFloodIntervalMillisecs;
        
        for (const [playerId, tracker] of this.trackers) {
            tracker.messages = tracker.messages.filter(t => t > cutoff);
            
            // Remover trackers vacíos para ahorrar memoria
            if (tracker.messages.length === 0) {
                this.trackers.delete(playerId);
            }
        }
        
        this.lastGlobalCleanup = currentTime;
    }

    /**
     * Obtiene los logs de antispam para debug
     */
    getAntiSpamLogs(): AntiSpamLog[] {
        return this.antiSpamLogs.slice(); // Retorna copia
    }

    /**
     * Limpia los logs de antispam
     */
    clearAntiSpamLogs(): void {
        this.antiSpamLogs = [];
    }

    /**
     * Obtiene estadísticas del sistema
     */
    getStats(): { activeTrackers: number, totalLogs: number } {
        return {
            activeTrackers: this.trackers.size,
            totalLogs: this.antiSpamLogs.length
        };
    }
}