/**
 * GameStateCoordinator - Coordinador central para evitar conflictos entre sistemas
 * 
 * Este coordinador previene el glitch donde el balance y stadium manager
 * compiten por parar/iniciar juegos y cambiar estadios simultáneamente.
 */

export class GameStateCoordinator {
    private isProcessingGameState = false;
    private pendingActions: Array<() => void> = [];
    private lastActionTime = 0;
    private readonly MIN_ACTION_INTERVAL = 1500; // 1.5 segundos entre acciones críticas

    /**
     * Ejecuta una acción crítica de forma coordinada
     */
    public async executeCoordinatedAction(
        actionName: string,
        action: () => void | Promise<void>,
        priority: 'high' | 'normal' = 'normal'
    ): Promise<void> {
        return new Promise((resolve) => {
            const wrappedAction = async () => {
                if (this.isProcessingGameState) {
                    // Si ya hay una acción en proceso, encolar esta
                    this.pendingActions.push(() => this.executeCoordinatedAction(actionName, action, priority));
                    return;
                }

                // Verificar intervalo mínimo entre acciones
                const now = Date.now();
                const timeSinceLastAction = now - this.lastActionTime;
                
                if (timeSinceLastAction < this.MIN_ACTION_INTERVAL) {
                    const delay = this.MIN_ACTION_INTERVAL - timeSinceLastAction;
                    setTimeout(() => this.executeCoordinatedAction(actionName, action, priority), delay);
                    return;
                }

                this.isProcessingGameState = true;
                this.lastActionTime = now;

                try {
                    window.gameRoom.logger.i('GameStateCoordinator', `Executing coordinated action: ${actionName}`);
                    await action();
                } catch (error) {
                    window.gameRoom.logger.e('GameStateCoordinator', `Error in coordinated action ${actionName}: ${error}`);
                } finally {
                    this.isProcessingGameState = false;
                    
                    // Procesar siguiente acción pendiente si existe
                    setTimeout(() => {
                        if (this.pendingActions.length > 0) {
                            const nextAction = this.pendingActions.shift();
                            if (nextAction) nextAction();
                        }
                    }, 100);
                    
                    resolve();
                }
            };

            if (priority === 'high') {
                // Acciones de alta prioridad se ejecutan inmediatamente
                wrappedAction();
            } else {
                // Acciones normales pueden esperar
                setTimeout(wrappedAction, 50);
            }
        });
    }

    /**
     * Verifica si el coordinador está procesando
     */
    public isProcessing(): boolean {
        return this.isProcessingGameState;
    }

    /**
     * Obtiene estadísticas del coordinador
     */
    public getStats() {
        return {
            isProcessing: this.isProcessingGameState,
            pendingActions: this.pendingActions.length,
            lastActionTime: this.lastActionTime,
            timeSinceLastAction: Date.now() - this.lastActionTime
        };
    }

    /**
     * Limpia acciones pendientes (usar con cuidado)
     */
    public clearPendingActions(): number {
        const clearedCount = this.pendingActions.length;
        this.pendingActions = [];
        this.isProcessingGameState = false; // También resetear el flag de procesamiento
        window.gameRoom.logger.w('GameStateCoordinator', `Cleared ${clearedCount} pending actions and reset processing flag`);
        return clearedCount;
    }

    /**
     * Método público para acceder al coordinador desde comandos
     */
    public getCoordinator(): GameStateCoordinator {
        return this;
    }
}