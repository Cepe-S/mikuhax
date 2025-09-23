export interface SanctionItem {
    id: number;
    ruid: string;
    type: 'ban' | 'mute';
    auth: string;
    conn: string;
    reason: string;
    register: number;
    expire: number;
    adminAuth?: string;
    adminName?: string;
    playerName?: string;
    active: boolean;
}

export class BanList {
    private bans: Map<string, SanctionItem> = new Map();
    private mutes: Map<string, SanctionItem> = new Map();

    addBan(auth: string, sanction: SanctionItem): void {
        this.bans.set(auth, sanction);
    }

    addMute(auth: string, sanction: SanctionItem): void {
        this.mutes.set(auth, sanction);
    }

    getBan(auth: string): SanctionItem | undefined {
        return this.bans.get(auth);
    }

    getMute(auth: string): SanctionItem | undefined {
        return this.mutes.get(auth);
    }

    removeBan(auth: string): boolean {
        return this.bans.delete(auth);
    }

    removeMute(auth: string): boolean {
        return this.mutes.delete(auth);
    }

    getAllBans(): SanctionItem[] {
        return Array.from(this.bans.values());
    }

    getAllMutes(): SanctionItem[] {
        return Array.from(this.mutes.values());
    }

    clear(): void {
        this.bans.clear();
        this.mutes.clear();
    }
}