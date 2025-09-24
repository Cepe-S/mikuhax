import { loadStadiumData } from "../../lib/stadiumLoader";

export enum StadiumState {
    READY = "ready",    // Esperando jugadores
    PLAYING = "playing" // Jugando con suficientes jugadores
}

export class StadiumManager {
    private currentState: StadiumState = StadiumState.READY;
    private currentStadium: string = "";
    private debugActions: Array<{
        timestamp: number;
        action: string;
        stadiumName: string;
        state: string;
        playerCount: number;
        minPlayers: number;
        reason: string;
    }> = [];
    
    public initialize(): void {
        // Force set ready stadium on initialization
        const readyMap = window.gameRoom.config.rules.readyMapName || "training";
        this.forceChangeStadium(readyMap, StadiumState.READY, "Server initialization");
        
        // Auto start game after initialization if auto-operating is enabled
        if (window.gameRoom.config.rules.autoOperating === true) {
            setTimeout(() => {
                if (window.gameRoom._room.getScores() === null) {
                    window.gameRoom._room.startGame();
                    window.gameRoom._room.sendAnnouncement(
                        "⚽ ¡Servidor iniciado! Partido comenzado automáticamente.",
                        null,
                        0x00AA00,
                        "bold",
                        1
                    );
                }
            }, 2000); // Delay to ensure stadium is fully loaded
        }
    }
    
    public checkPlayerCount(): void {
        const playerCount = this.getActivePlayers();
        const minPlayers = window.gameRoom.config.rules.requisite.minimumPlayers;
        
        if (playerCount >= minPlayers && this.currentState === StadiumState.READY) {
            this.setGameStadium();
        }
        
        // GARANTIZAR que siempre haya un juego iniciado si auto-operating está activo
        if (window.gameRoom.config.rules.autoOperating === true) {
            setTimeout(() => {
                if (window.gameRoom._room.getScores() === null) {
                    window.gameRoom._room.startGame();
                    window.gameRoom.logger.i('StadiumManager', 'Auto-started game to prevent hanging');
                }
            }, 1000);
        }
    }
    
    public onGameEnd(): void {
        setTimeout(() => {
            const playerCount = this.getActivePlayers();
            const minPlayers = window.gameRoom.config.rules.requisite.minimumPlayers;
            
            if (playerCount < minPlayers) {
                this.setReadyStadium();
            } else {
                this.setGameStadium();
            }
            
            // GARANTIZAR que SIEMPRE se inicie un nuevo juego
            if (window.gameRoom.config.rules.autoOperating === true) {
                setTimeout(() => {
                    if (window.gameRoom._room.getScores() === null) {
                        window.gameRoom._room.startGame();
                        window.gameRoom.logger.i('StadiumManager', 'New game started after match end');
                    }
                }, 1500);
            }
        }, 1000);
    }
    
    private setReadyStadium(): void {
        const readyMap = window.gameRoom.config.rules.readyMapName || "training";
        this.changeStadium(readyMap, StadiumState.READY);
    }
    
    private setGameStadium(): void {
        const gameMap = window.gameRoom.config.rules.defaultMapName || "futx4";
        this.changeStadium(gameMap, StadiumState.PLAYING);
    }
    
    private changeStadium(stadiumName: string, newState: StadiumState): void {
        // Don't skip if state is changing, even if stadium name is the same
        if (this.currentStadium === stadiumName && this.currentState === newState) return;
        
        const playerCount = this.getActivePlayers();
        const minPlayers = window.gameRoom.config.rules.requisite.minimumPlayers;
        const reason = newState === StadiumState.READY ? "Not enough players" : "Sufficient players joined";
        
        this.forceChangeStadium(stadiumName, newState, reason);
    }
    
    private forceChangeStadium(stadiumName: string, newState: StadiumState, reason: string): void {
        const playerCount = this.getActivePlayers();
        const minPlayers = window.gameRoom.config.rules.requisite.minimumPlayers;
        
        try {
            // Step 1: Solo parar el juego si realmente necesitamos cambiar el estadio
            const needsStadiumChange = this.currentStadium !== stadiumName;
            if (needsStadiumChange && window.gameRoom._room.getScores() !== null) {
                window.gameRoom._room.stopGame();
                window.gameRoom.logger.i('StadiumManager', 'Game stopped before stadium change');
            }
            
            // Step 2: Solo cambiar el estadio si es diferente al actual
            if (needsStadiumChange) {
                const stadiumData = loadStadiumData(stadiumName);
                window.gameRoom.logger.i('StadiumManager', `Setting stadium data for ${stadiumName}, length: ${stadiumData.length} chars`);
                window.gameRoom._room.setCustomStadium(stadiumData);
                
                // Reinicializar sistema de powershot después del cambio de estadio
                if (window.gameRoom.ballStack) {
                    window.gameRoom.ballStack.initPowershotSystem();
                }
            }
            
            const previousState = this.currentState;
            this.currentStadium = stadiumName;
            this.currentState = newState;
            
            // Solo mostrar mensaje y agregar debug action si hubo un cambio real
            if (needsStadiumChange || previousState !== newState) {
                // Add debug action
                this.addDebugAction("STADIUM_CHANGE", stadiumName, newState, playerCount, minPlayers, reason);
                
                const stateText = newState === StadiumState.READY ? "Esperando jugadores" : "Iniciando partido";
                const mapText = stadiumName === "training" || stadiumName === "ready" ? "TRAINING" : stadiumName.toUpperCase();
                window.gameRoom._room.sendAnnouncement(
                    `🏟️ ${stateText}: ${mapText} (${playerCount}/${minPlayers} jugadores)`,
                    null,
                    newState === StadiumState.READY ? 0xFFD700 : 0x00FF00,
                    "bold",
                    1
                );
            }
            
            // Step 3: SIEMPRE iniciar el juego si auto-operating está habilitado
            if (window.gameRoom.config.rules.autoOperating === true) {
                setTimeout(() => {
                    if (window.gameRoom._room.getScores() === null) {
                        window.gameRoom._room.startGame();
                        window.gameRoom.logger.i('StadiumManager', 'Game started after stadium change');
                    }
                }, 500);
            }
            
            window.gameRoom.logger.i('StadiumManager', `Stadium changed to ${stadiumName} (${newState}) - ${reason} - Players: ${playerCount}/${minPlayers}`);
        } catch (error) {
            window.gameRoom.logger.e('StadiumManager', `Failed to change stadium: ${error}`);
        }
    }
    
    private getActivePlayers(): number {
        return Array.from(window.gameRoom.playerList.values())
            .filter(p => !p.permissions.afkmode).length;
    }
    
    public getCurrentState(): StadiumState {
        return this.currentState;
    }
    
    public getCurrentStadium(): string {
        return this.currentStadium;
    }
    
    private addDebugAction(action: string, stadiumName: string, state: StadiumState, playerCount: number, minPlayers: number, reason: string): void {
        this.debugActions.unshift({
            timestamp: Date.now(),
            action,
            stadiumName,
            state,
            playerCount,
            minPlayers,
            reason
        });
        
        // Keep only last 20 actions
        if (this.debugActions.length > 20) {
            this.debugActions = this.debugActions.slice(0, 20);
        }
    }
    
    public getDebugStatus(): any {
        const playerCount = this.getActivePlayers();
        const minPlayers = window.gameRoom.config.rules.requisite.minimumPlayers;
        const readyMap = window.gameRoom.config.rules.readyMapName || "training";
        const gameMap = window.gameRoom.config.rules.defaultMapName || "futx4";
        
        return {
            currentStadium: this.currentStadium,
            currentState: this.currentState,
            playerCount,
            minPlayers,
            readyMap,
            gameMap,
            recentActions: this.debugActions
        };
    }
    
    public forceStadiumChange(stadiumName: string, reason: string = "Manual override"): boolean {
        try {
            const newState = stadiumName === "training" || stadiumName === "ready" ? StadiumState.READY : StadiumState.PLAYING;
            this.forceChangeStadium(stadiumName, newState, reason);
            return true;
        } catch (error) {
            window.gameRoom.logger.e('StadiumManager', `Failed to force stadium change: ${error}`);
            return false;
        }
    }
}