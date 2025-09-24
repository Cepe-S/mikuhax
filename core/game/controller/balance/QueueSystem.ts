import { PlayerObject } from "../../model/GameObject/PlayerObject";

export interface QueueEntry {
    playerId: number;
    playerAuth: string;
    playerName: string;
    joinTime: number;
    rating: number;
}

export class QueueSystem {
    private queue: QueueEntry[] = [];
    private debugLogs: string[] = [];

    public addToQueue(player: PlayerObject): void {
        const playerData = window.gameRoom.playerList.get(player.id);
        if (!playerData) return;
        
        // Don't add AFK players to queue
        if (playerData.permissions.afkmode) {
            this.addDebugLog(`Player ${player.name} not added to queue - is AFK`);
            return;
        }

        const entry: QueueEntry = {
            playerId: player.id,
            playerAuth: player.auth,
            playerName: player.name,
            joinTime: Date.now(),
            rating: playerData.stats.rating
        };

        this.queue.push(entry);
        this.queue.sort((a, b) => a.joinTime - b.joinTime);
        
        this.addDebugLog(`Player ${player.name} added to queue. Position: ${this.queue.length}`);
    }

    public removeFromQueue(playerId: number): void {
        const index = this.queue.findIndex(entry => entry.playerId === playerId);
        if (index !== -1) {
            const removed = this.queue.splice(index, 1)[0];
            this.addDebugLog(`Player ${removed.playerName} removed from queue`);
        }
    }

    public getNextPlayer(): QueueEntry | null {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    public popNextPlayer(): QueueEntry | null {
        // Remove any AFK players from queue before popping
        this.removeAfkPlayersFromQueue();
        
        const next = this.queue.shift();
        if (next) {
            this.addDebugLog(`Player ${next.playerName} popped from queue`);
        }
        return next || null;
    }

    public getQueueLength(): number {
        // Clean AFK players before returning length
        this.removeAfkPlayersFromQueue();
        return this.queue.length;
    }

    public getQueue(): QueueEntry[] {
        // Clean AFK players before returning queue
        this.removeAfkPlayersFromQueue();
        return [...this.queue];
    }

    public clearQueue(): void {
        this.queue = [];
        this.addDebugLog("Queue cleared");
    }

    public getDebugLogs(): string[] {
        return [...this.debugLogs];
    }

    private addDebugLog(message: string): void {
        const timestamp = new Date().toISOString();
        this.debugLogs.push(`[${timestamp}] ${message}`);
        if (this.debugLogs.length > 100) {
            this.debugLogs.shift();
        }
    }
    
    private removeAfkPlayersFromQueue(): void {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(entry => {
            const playerData = window.gameRoom.playerList.get(entry.playerId);
            if (!playerData || playerData.permissions.afkmode) {
                this.addDebugLog(`Player ${entry.playerName} removed from queue - AFK or disconnected`);
                return false;
            }
            return true;
        });
        
        if (this.queue.length !== initialLength) {
            this.addDebugLog(`Cleaned ${initialLength - this.queue.length} AFK/disconnected players from queue`);
        }
    }
}