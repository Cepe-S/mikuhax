export interface ConnectionModel {
    ruid: string;
    conn: string;
    auth: string;
    playerName: string;
    ipAddress?: string;
    country?: string;
    city?: string;
    isp?: string;
    isVpn: boolean;
    isSuspicious: boolean;
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
