// Minimal stub QueueSystem
export class QueueSystem {
    private static instance: QueueSystem;

    private constructor() {}

    public static getInstance(): QueueSystem {
        if (!QueueSystem.instance) {
            QueueSystem.instance = new QueueSystem();
        }
        return QueueSystem.instance;
    }

    public shouldQueueBeActive(): boolean {
        return false;
    }

    public onPlayerGoesAFK(playerId: number): void {
        // Stub
    }

    public onPlayerReturnsFromAFK(playerId: number): boolean {
        return false;
    }
}