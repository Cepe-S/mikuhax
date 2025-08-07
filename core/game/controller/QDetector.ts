/**
 * Q Detector System - Detecta spam de "q" en el chat
 * Cuando la gente spamea "q" generalmente es porque pasó algo raro
 */

interface QEvent {
    playerName: string;
    playerId: number;
    timestamp: number;
}

export class QDetector {
    private qEvents: QEvent[] = [];
    private readonly timeWindow = 5000; // 5 segundos en millisegundos
    private readonly fastTimeWindow = 3000; // 3 segundos en millisegundos (modo acelerado)
    private readonly minQsToActivate = 5; // Mínimo 5 Q's para activar el sistema
    private readonly minPlayersRequired = 2; // Mínimo 2 personas diferentes
    private lastAlertTime = 0;
    private readonly alertCooldown = 10000; // 10 segundos de cooldown entre alertas
    private evaluationTimer: NodeJS.Timeout | null = null;
    private isInFastMode = false; // Si estamos en modo 3 segundos (después de 5 Q's)

    /**
     * Procesar un mensaje del chat para detectar "q"
     */
    public processMessage(playerName: string, playerId: number, message: string): void {
        // Verificar si el mensaje es solo "q" (o variaciones como "Q", "q?", "q!", etc.)
        const normalizedMessage = message.trim().toLowerCase();
        const isQMessage = /^q[?!]*$/.test(normalizedMessage);

        if (isQMessage) {
            this.addQEvent(playerName, playerId);
            
            // Solo limpiar eventos antiguos si NO estamos en modo rápido
            if (!this.isInFastMode) {
                this.cleanOldEvents(Date.now());
            }
            
            const currentQCount = this.qEvents.length;
            const uniquePlayerIds = [...new Set(this.qEvents.map(e => e.playerId))];
            
            if (!this.isInFastMode) {
                // Modo inicial: esperando 5 Q's en 5 segundos
                if (currentQCount >= this.minQsToActivate && uniquePlayerIds.length >= this.minPlayersRequired) {
                    // Se cumplieron las condiciones, cambiar a modo rápido
                    this.isInFastMode = true;
                    this.scheduleEvaluation(true); // Timer de 3 segundos
                    window.gameRoom.logger.i('QDetector', `Switched to fast mode: ${currentQCount} Q's from ${uniquePlayerIds.length} players`);
                } else if (currentQCount === 1) {
                    // Primera Q, iniciar timer de 5 segundos
                    this.scheduleEvaluation(false);
                }
            } else {
                // Modo rápido: reiniciar timer de 3 segundos con cada nueva Q
                this.scheduleEvaluation(true);
                window.gameRoom.logger.i('QDetector', `Fast mode: restarting 3s timer (${currentQCount} Q's total)`);
            }
        }
    }

    /**
     * Programar evaluación después de 5 segundos (primera vez) o 3 segundos (modo rápido)
     */
    private scheduleEvaluation(isFastMode: boolean = false): void {
        // Cancelar cualquier timer existente
        if (this.evaluationTimer) {
            clearTimeout(this.evaluationTimer);
            this.evaluationTimer = null;
        }

        // Usar timer rápido (3s) en modo rápido, sino usar timer normal (5s)
        const delay = isFastMode ? this.fastTimeWindow : this.timeWindow;

        // Programar evaluación
        this.evaluationTimer = setTimeout(() => {
            this.evaluateQSpam();
            this.evaluationTimer = null;
        }, delay);
    }

    /**
     * Agregar un evento de "q" al registro
     */
    private addQEvent(playerName: string, playerId: number): void {
        const now = Date.now();
        this.qEvents.push({
            playerName,
            playerId,
            timestamp: now
        });

        // Log detallado para debugging
        const uniquePlayers = [...new Set(this.qEvents.map(e => e.playerId))];
        const playerNames = [...new Set(this.qEvents.map(e => `${e.playerName}#${e.playerId}`))];

        // No limpiar eventos aquí para no perder "q" recientes
        // La limpieza se hace solo cuando se evalúa
    }

    /**
     * Limpiar eventos antiguos que están fuera de la ventana de tiempo
     */
    private cleanOldEvents(currentTime: number): void {
        const beforeCount = this.qEvents.length;
        this.qEvents = this.qEvents.filter(event => 
            currentTime - event.timestamp <= this.timeWindow
        );
    }

    /**
     * Evaluar si hay spam de "q" después de esperar
     */
    private evaluateQSpam(): void {
        const now = Date.now();
        
        // Log antes de evaluar
        
        // Verificar cooldown de alerta
        if (now - this.lastAlertTime < this.alertCooldown) {
            this.resetToNormalMode();
            return;
        }

        // En modo rápido, no limpiar - evaluar todos los eventos acumulados
        // En modo normal, limpiar eventos antiguos
        let eventsToEvaluate: QEvent[];
        
        if (this.isInFastMode) {
            // En modo rápido, evaluar todos los eventos acumulados desde que empezó
            eventsToEvaluate = [...this.qEvents];
        } else {
            // En modo normal, limpiar eventos antiguos primero
            this.cleanOldEvents(now);
            eventsToEvaluate = [...this.qEvents];
        }

        // Log detallado de eventos a evaluar
        const playerIds = [...new Set(eventsToEvaluate.map(e => e.playerId))];
        const playerNames = [...new Set(eventsToEvaluate.map(e => `${e.playerName}#${e.playerId}`))];

        // Verificar condiciones para activar alerta
        if (eventsToEvaluate.length >= this.minQsToActivate && playerIds.length >= this.minPlayersRequired) {
            this.triggerAlert(eventsToEvaluate);
            this.lastAlertTime = now;
        }

        // Resetear a modo normal después de evaluar
        this.resetToNormalMode();
    }

    /**
     * Resetear a modo normal (salir del modo rápido)
     */
    private resetToNormalMode(): void {
        this.isInFastMode = false;
        this.qEvents = []; // Limpiar todos los eventos al finalizar
    }

    /**
     * Activar alerta de spam de "q"
     */
    private triggerAlert(events: QEvent[]): void {
        const count = events.length;
        const uniquePlayerIds = [...new Set(events.map(e => e.playerId))];
        const uniquePlayerNames = [...new Set(events.map(e => e.playerName))];
        
        let alertMessage: string;
        
        if (uniquePlayerIds.length === 1) {
            // Solo una persona
            alertMessage = `🤔 ¿Qué pasó acá? ${uniquePlayerNames[0]} dijo "q" ${count} veces`;
        } else if (uniquePlayerIds.length === 2) {
            // Dos personas
            alertMessage = `🤔 ¿Qué pasó acá? ${uniquePlayerNames.join(' y ')} dijeron "q" ${count} veces`;
        } else {
            // Múltiples personas - mostrar todos los nombres
            const namesList = uniquePlayerNames.length <= 5 
                ? uniquePlayerNames.join(', ')
                : uniquePlayerNames.slice(0, 5).join(', ') + ` y ${uniquePlayerNames.length - 5} más`;
            alertMessage = `🤔 ¿Qué pasó acá? ${namesList} dijeron "q" ${count} veces`;
        }

        // Enviar mensaje al chat
        window.gameRoom._room.sendAnnouncement(
            alertMessage,
            null, // Enviar a todos
            0xFFD700, // Color dorado
            "normal",
            1
        );

        // Log para debugging
        window.gameRoom.logger.i('QDetector', `Q spam detected: ${count} events from ${uniquePlayerIds.length} players: [${uniquePlayerNames.join(', ')}]`);
    }

    /**
     * Resetear el detector (útil para nuevos juegos)
     */
    public reset(): void {
        this.qEvents = [];
        this.lastAlertTime = 0;
        this.isInFastMode = false;
        
        // Limpiar timer pendiente si existe
        if (this.evaluationTimer) {
            clearTimeout(this.evaluationTimer);
            this.evaluationTimer = null;
        }
    }

    /**
     * Obtener estadísticas actuales del detector
     */
    public getStats(): { eventsInWindow: number, lastAlertAgo: number } {
        const now = Date.now();
        this.cleanOldEvents(now);
        
        return {
            eventsInWindow: this.qEvents.length,
            lastAlertAgo: now - this.lastAlertTime
        };
    }
}

// Instancia global del detector
export const qDetector = new QDetector();
