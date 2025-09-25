import { TeamID } from "./TeamID";

export class KickStack {
    /*
    KickStack is a Stack for tracing who kicked the ball.
    It can be used for processing who goaled, who made OG, and so on.
    */

    // single ton pattern 
    private static instance: KickStack = new KickStack();
    private _store: number[] = [];
    private ballPossession = {
        red: 0,
        blue: 0
    };
    private lastTouched = {
        id: 0,
        team: 0
    };

    // Powershot system properties
    private powershot = {
        isActive: false,
        counter: 0,
        currentPlayerId: 0,
        activationThreshold: 100, // we don't know hom many seconds are :c
        normalColor: 0xFFFFFF,     // White
        powershotColor: 0xFF4500,  // Red-orange
        normalInvMass: 1.5,        // Normal ball physics (will be updated from settings)
        powershotInvMass: 2.0,     // Double the power (higher invMass = more power for kicks)
        timerInterval: null as NodeJS.Timeout | null,
        lastBallPos: { x: 0, y: 0 }, // To detect if ball is moving
        ballStuckCounter: 0,         // Counter for how long ball has been stuck to player
        stickDistance: 26            // Distance threshold to consider ball "stuck" to player (in pixels)
    };

    private KickStack<Number>() { } // not use
    public static getInstance(): KickStack {
        if (this.instance == null) {
            this.instance = new KickStack();
        }
        return this.instance;
    }
    
    push(playerID: number): void {
        this._store.push(playerID);
    }
    pop(): number | undefined {
        return this._store.pop();
    }
    clear(): void {
        this._store = []; // clear
    }
    
    initTouchInfo(): void {
        this.lastTouched = {
            id: 0,
            team: 0
        };
    }
    getLastTouchPlayerID(): number {
        return this.lastTouched.id; // playerID
    }
    touchPlayerSubmit(id: number) { // playerID
        this.lastTouched.id = id;
    }
    touchTeamSubmit(team: TeamID) { // 1: red team, 2: blue team
        this.lastTouched.team = team;
    }
    passJudgment(team: TeamID): boolean { // 1: red team, 2: blue team
        if(this.lastTouched.team == team) {
            return true;
        } else {
            return false;
        }
    }

    possCount(team: TeamID): void { // 1: red team, 2: blue team
        if(team == TeamID.Red) { 
            this.ballPossession.red++;
        } else if(team == TeamID.Blue) {
            this.ballPossession.blue++;
        }
    }
    possCalculate(team: TeamID): number { // 1: red team, 2: blue team
        if(this.ballPossession.red == 0 && this.ballPossession.blue == 0) {
            return 0;
        } else {
            if(team === TeamID.Red) {
                return Math.round((this.ballPossession.red / (this.ballPossession.red + this.ballPossession.blue)) * 100);
            } else if(team === TeamID.Blue) {
                return Math.round((this.ballPossession.blue / (this.ballPossession.red + this.ballPossession.blue)) * 100);
            }
        }
        return 0;
    }
    possClear(): void {
        this.ballPossession = {red: 0, blue: 0};
    }

    // ==================== POWERSHOT SYSTEM ====================
    
    /**
     * Check if ball is stuck to a specific player using distance calculation
     */
    private isBallStuckToPlayer(playerId: number): boolean {
        if (typeof window === 'undefined' || !window.gameRoom || !window.gameRoom._room) {
            return false;
        }

        try {
            // Get ball position
            const ballPosition = window.gameRoom._room.getBallPosition();
            if (!ballPosition || ballPosition.x == null || ballPosition.y == null) {
                return false;
            }

            // Get player position
            const player = window.gameRoom._room.getPlayer(playerId);
            if (!player || !player.position || player.position.x == null || player.position.y == null) {
                return false;
            }

            // Calculate distance between ball and player
            const deltaX = ballPosition.x! - player.position.x!;
            const deltaY = ballPosition.y! - player.position.y!;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Simple boolean logic: if player is within stick distance, they have the ball
            const result = distance <= this.powershot.stickDistance;
            
            return result;
        } catch (error) {
            // If there's any error accessing positions, fall back to lastTouched method
            return this.lastTouched.id === playerId;
        }
    }

    /**
     * Start powershot timer for a player (with distance-based detection)
     */
    startPowershotTimer(playerId: number): void {
        // Check if powershot is enabled in settings
        if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.config && window.gameRoom.config.settings && !window.gameRoom.config.settings.powershotEnabled) {
            return; // Powershot disabled
        }

        // Don't start if no valid player ID
        if (!playerId || playerId === 0) {
            return;
        }

        // Check if ball is actually stuck to this player before starting timer
        if (!this.isBallStuckToPlayer(playerId)) {
            return; // Ball is not stuck to player, don't start timer
        }

        // Reset if different player or if already active
        if (this.powershot.currentPlayerId !== playerId) {
            this.resetPowershot();
            this.powershot.currentPlayerId = playerId;
        }

        // Don't restart timer if already running for same player
        if (this.powershot.timerInterval && this.powershot.currentPlayerId === playerId) {
            return;
        }

        // Always sync configuration when starting timer to ensure current values
        this.syncPowershotConfig();

        // Convert deciseconds to number of 25ms ticks
        // 1 decisecond = 100ms, so 100ms / 25ms = 4 ticks per decisecond
        const activationTimeDeciseconds = 
            (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.config && window.gameRoom.config.settings) 
            ? (window.gameRoom.config.settings.powershotActivationTime || 10)
            : 10;
        this.powershot.activationThreshold = activationTimeDeciseconds * 4; // 4 ticks per decisecond

        // Initialize timer
        this.powershot.counter = 0;
        this.powershot.ballStuckCounter = 0;

        // Start timer - check every 25ms for responsive flashing (2x faster)
        this.powershot.timerInterval = setInterval(() => {
            // Check if ball is still stuck to this player using distance detection
            if (!this.isBallStuckToPlayer(playerId)) {
                // Ball is no longer stuck to player, reset powershot
                this.resetPowershot();
                return;
            }

            this.powershot.counter++;
            this.powershot.ballStuckCounter++;
            
            // Sistema de titileo basado en porcentaje del tiempo total
            const progressPercent = (this.powershot.counter / this.powershot.activationThreshold) * 100;
            
            // Solo manejar colores si no se ha activado aún el powershot
            if (!this.powershot.isActive && window.gameRoom._room) {
                // Titileo empieza al 60% del tiempo y termina al 100%
                if (progressPercent >= 60 && progressPercent < 100) {
                    // Calcular cuántos ticks han pasado en este 40% de tiempo (60% a 100%)
                    const flashingPeriod = this.powershot.activationThreshold * 0.4; // 40% del tiempo total
                    const ticksInFlashingPeriod = this.powershot.counter - (this.powershot.activationThreshold * 0.6);
                    
                    // Dividir el período de titileo en exactamente 2 ciclos completos
                    const cycleDuration = flashingPeriod / 2; // Cada ciclo es 20% del tiempo total
                    const currentCycle = Math.floor(ticksInFlashingPeriod / cycleDuration);
                    const ticksInCurrentCycle = ticksInFlashingPeriod % cycleDuration;
                    const isFirstHalfOfCycle = ticksInCurrentCycle < (cycleDuration / 2);
                    
                    // Solo titilar si estamos en uno de los 2 ciclos permitidos
                    if (currentCycle < 2) {
                        const flashColor = isFirstHalfOfCycle ? 0xCCCCCC : this.powershot.normalColor; // Gris claro/Blanco
                        
                        try {
                            window.gameRoom._room.setDiscProperties(0, { color: flashColor });
                        } catch (e) {
                            // Ignore errors during color setting
                        }
                    } else {
                        // Después de los 2 ciclos, mantener color normal
                        try {
                            window.gameRoom._room.setDiscProperties(0, { color: this.powershot.normalColor });
                        } catch (e) {
                            // Ignore errors during color setting
                        }
                    }
                } else if (progressPercent < 60) {
                    // Mantener pelota blanca antes del 60%
                    try {
                        window.gameRoom._room.setDiscProperties(0, { color: this.powershot.normalColor });
                    } catch (e) {
                        // Ignore errors during color setting
                    }
                }
            }
            
            // Activate powershot when threshold is reached
            if (this.powershot.counter >= this.powershot.activationThreshold && !this.powershot.isActive) {
                this.activatePowershot();
            }
        }, 25); // Update every 25ms for faster, smoother flashing
    }

    /**
     * Stop powershot timer
     */
    stopPowershotTimer(): void {
        if (this.powershot.timerInterval) {
            clearInterval(this.powershot.timerInterval);
            this.powershot.timerInterval = null;
        }
    }

    /**
     * Activate powershot mode
     */
    private activatePowershot(): void {
        if (this.powershot.isActive) return;

        this.powershot.isActive = true;
        
        // Change ball color to powershot color
        if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom._room) {
            window.gameRoom._room.setDiscProperties(0, {
                color: this.powershot.powershotColor,
                invMass: this.powershot.powershotInvMass
            });
            
            // Log powershot activation (only to logs, not to chat)
            window.gameRoom.logger.i('powershot', `🔥 Powershot activated! Player #${this.powershot.currentPlayerId}`);
        }
    }

    /**
     * Manually activate powershot (for admin command usage)
     */
    activatePowershotManually(): boolean {
        // Check if powershot is enabled (with safe checks)
        if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.config && window.gameRoom.config.settings && !window.gameRoom.config.settings.powershotEnabled) {
            return false;
        }

        // Sync configuration to ensure we have current values
        this.syncPowershotConfig();

        this.activatePowershot();
        return true;
    }

    /**
     * Apply powershot effect when ball is kicked
     */
    applyPowershotKick(): boolean {
        if (!this.powershot.isActive) return false;

        // The ball already has the powershot properties set
        // Return true to indicate powershot was applied
        window.gameRoom.logger.i('powershot', `⚡ Powershot kick applied by Player #${this.powershot.currentPlayerId}!`);
        
        // Reset powershot after kick (this will reset color and physics)
        this.resetPowershot();
        return true;
    }

    /**
     * Sync powershot configuration with current game settings
     */
    private syncPowershotConfig(): void {
        if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.config && window.gameRoom.config.settings) {
            const settings = window.gameRoom.config.settings;
            this.powershot.normalColor = settings.powershotNormalColor || 0xFFFFFF;
            this.powershot.powershotColor = settings.powershotActiveColor || 0xFF4500;
            this.powershot.normalInvMass = settings.ballInvMass || 1.5;
            this.powershot.powershotInvMass = settings.powershotInvMassFactor || 2.0;
            this.powershot.stickDistance = settings.powershotStickDistance || 26;
        }
    }

    /**
     * Reset powershot to normal state
     */
    resetPowershot(): void {
        this.stopPowershotTimer();
        
        // Sync configuration before resetting
        this.syncPowershotConfig();
        
        // Always reset ball color and physics to normal
        if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom._room) {
            window.gameRoom._room.setDiscProperties(0, {
                color: this.powershot.normalColor,
                invMass: this.powershot.normalInvMass
            });
        }

        this.powershot.isActive = false;
        this.powershot.counter = 0;
        this.powershot.currentPlayerId = 0;
    }

    /**
     * Check if powershot is currently active
     */
    isPowershotActive(): boolean {
        return this.powershot.isActive;
    }

    /**
     * Get current powershot counter
     */
    getPowershotCounter(): number {
        return this.powershot.counter;
    }

    /**
     * Get current powershot player
     */
    getPowershotPlayer(): number {
        return this.powershot.currentPlayerId;
    }

    /**
     * Check and potentially start powershot timer based on ball position
     * This should be called regularly to detect when ball gets stuck to a player
     */
    checkBallStuckToPlayer(playerId: number): void {
        if (!playerId || playerId === 0) return;

        // Check if ball is stuck to this player
        const isBallStuck = this.isBallStuckToPlayer(playerId);
        const wasStuckBefore = this.powershot.currentPlayerId === playerId && this.powershot.timerInterval !== null;
        
        if (isBallStuck && !wasStuckBefore) {
            // If we have a timer for a different player, that player no longer has the ball
            if (this.powershot.timerInterval && this.powershot.currentPlayerId !== playerId) {
                if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.logger) {
                    window.gameRoom.logger.i('powershot', `Player switch detected: #${this.powershot.currentPlayerId} -> #${playerId}`);
                }
                this.resetPowershot();
            }
            this.startPowershotTimer(playerId);
            
        } else if (!isBallStuck && wasStuckBefore) {
            // Ball just got unstuck
            if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.logger) {
                window.gameRoom.logger.i('powershot', `Ball unstuck from player #${playerId}`);
            }
            this.resetPowershot();
        }
        // If isBallStuck && wasStuckBefore: still stuck (no action needed)
        // If !isBallStuck && !wasStuckBefore: still not stuck (no action needed)
    }

    /**
     * Initialize powershot system with current game settings
     * This should be called at game start to ensure all config values are properly loaded
     */
    initPowershotSystem(): void {
        // First sync configuration
        this.syncPowershotConfig();
        
        // Then reset to ensure clean state
        this.resetPowershot();
        
        // Also set initial ball properties if room exists
        if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom._room) {
            try {
                window.gameRoom._room.setDiscProperties(0, {
                    color: this.powershot.normalColor,
                    invMass: this.powershot.normalInvMass
                });
            } catch (e) {
                // Ignore errors during initial ball setup
            }
        }
    }

    /**
     * Public method to check if ball is stuck to a player (for external use)
     */
    isPlayerHoldingBall(playerId: number): boolean {
        return this.isBallStuckToPlayer(playerId);
    }

    /**
     * Get detailed powershot debug information
     */
    getPowershotDebugInfo(): any {
        return {
            isActive: this.powershot.isActive,
            counter: this.powershot.counter,
            currentPlayerId: this.powershot.currentPlayerId,
            activationThreshold: this.powershot.activationThreshold,
            timerRunning: this.powershot.timerInterval !== null,
            ballStuckCounter: this.powershot.ballStuckCounter,
            stickDistance: this.powershot.stickDistance,
            normalColor: this.powershot.normalColor,
            powershotColor: this.powershot.powershotColor,
            normalInvMass: this.powershot.normalInvMass,
            powershotInvMass: this.powershot.powershotInvMass,
            lastBallPos: this.powershot.lastBallPos
        };
    }
}