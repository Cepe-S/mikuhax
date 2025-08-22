export interface BanListModel {
    auth?: string;
    conn: string; 
    reason: string;
    register: number;
    expire: number;
    adminAuth?: string;
    adminName?: string;
    playerName?: string;
}