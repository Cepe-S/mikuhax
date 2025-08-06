export interface ConnectionModel {
    ruid: string;
    conn: string;
    auth: string;
    playerName: string;
    ipAddress?: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    isp?: string;
    timezone?: string;
    isVpn: boolean;
    isSuspicious: boolean;
    spamScore?: number;
    joinCount?: number;
    kickCount?: number;
    banCount?: number;
    aliases?: string; // JSON string
    spamPatterns?: string; // JSON string
    firstSeen?: Date;
    lastSeen?: Date;
    lastActivity?: Date;
}

export interface GeolocationData {
    country?: string;
    city?: string;
    isp?: string;
    isVpn?: boolean;
}

export interface SpamPattern {
    type: 'flood' | 'unicode' | 'repeat' | 'links' | 'joinFlood' | 'nameChange';
    count: number;
    lastDetected: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AntiSpamConfig {
    maxJoinsPerMinute: number;
    maxSpamScore: number;
    bannedUnicodePatterns: string[];
    allowedDomains: string[];
    autobanThreshold: number;
    vpnDetectionEnabled: boolean;
}
