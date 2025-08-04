import { PlayerObject } from "../model/GameObject/PlayerObject";
import { getUnixTimestamp } from "./Statistics";

/**
 * Local connection tracker that stores data in browser localStorage
 * This avoids CORS and Private Network Access issues
 */

interface LocalConnectionData {
    auth: string;
    nickname: string;
    ipAddress: string;
    country: string;
    city: string;
    timestamp: number;
    sessionStart: number;
}

interface LocalPlayerStats {
    auth: string;
    firstSeen: number;
    lastSeen: number;
    totalConnections: number;
    uniqueIPs: Set<string>;
    recentConnections: LocalConnectionData[];
    nicknames: Set<string>;
}

const STORAGE_KEY = 'haxbotron_connections';
const MAX_HISTORY = 100; // Keep last 100 connections per player

/**
 * Load connection data from localStorage
 */
function loadConnectionData(): Map<string, LocalPlayerStats> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return new Map();

        const data = JSON.parse(stored);
        const result = new Map<string, LocalPlayerStats>();

        for (const [auth, stats] of Object.entries(data)) {
            const playerStats = stats as any;
            result.set(auth, {
                auth: playerStats.auth,
                firstSeen: playerStats.firstSeen,
                lastSeen: playerStats.lastSeen,
                totalConnections: playerStats.totalConnections,
                uniqueIPs: new Set(playerStats.uniqueIPs),
                recentConnections: playerStats.recentConnections || [],
                nicknames: new Set(playerStats.nicknames)
            });
        }

        return result;
    } catch (error) {
        window.gameRoom.logger.w('LocalConnectionTracker', `Failed to load data: ${error}`);
        return new Map();
    }
}

/**
 * Save connection data to localStorage
 */
function saveConnectionData(data: Map<string, LocalPlayerStats>): void {
    try {
        const toSave: any = {};
        
        for (const [auth, stats] of data) {
            toSave[auth] = {
                auth: stats.auth,
                firstSeen: stats.firstSeen,
                lastSeen: stats.lastSeen,
                totalConnections: stats.totalConnections,
                uniqueIPs: Array.from(stats.uniqueIPs),
                recentConnections: stats.recentConnections.slice(-MAX_HISTORY), // Keep only recent
                nicknames: Array.from(stats.nicknames)
            };
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
        window.gameRoom.logger.w('LocalConnectionTracker', `Failed to save data: ${error}`);
    }
}

/**
 * Decode IP address if it's in hexadecimal format
 */
function decodeIP(conn: string): string {
    // Check if it looks like a hex string (only hex characters and proper length)
    if (/^[0-9A-Fa-f]+$/.test(conn) && conn.length >= 8) {
        try {
            // Try to decode as ASCII hex first (most common case for Haxball)
            let decoded = '';
            for (let i = 0; i < conn.length; i += 2) {
                const hexPair = conn.substr(i, 2);
                const charCode = parseInt(hexPair, 16);
                if (charCode >= 32 && charCode <= 126) { // Printable ASCII range
                    decoded += String.fromCharCode(charCode);
                }
            }
            
            // Check if decoded result looks like an IP
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(decoded)) {
                return decoded;
            }
            
            // Fallback: Try direct hex to IP conversion (4 bytes)
            if (conn.length >= 8) {
                const hex = conn.match(/.{1,2}/g);
                if (hex && hex.length >= 4) {
                    const ip = hex.slice(0, 4).map(h => parseInt(h, 16)).join('.');
                    
                    // Validate IP format and reasonable ranges
                    const parts = ip.split('.').map(p => parseInt(p));
                    if (parts.every(p => p >= 0 && p <= 255)) {
                        return ip;
                    }
                }
            }
        } catch (error) {
            // If decoding fails, continue to return original
        }
    }
    
    // If not hex or decoding failed, check if it's already a valid IP
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(conn)) {
        return conn;
    }
    
    return conn;
}

/**
 * Track player connection locally
 */
export function trackPlayerConnectionLocal(player: PlayerObject): void {
    try {
        const timestamp = getUnixTimestamp();
        const decodedIP = decodeIP(player.conn);
        
        // Load existing data
        const connectionData = loadConnectionData();
        
        // Get or create player stats
        let playerStats = connectionData.get(player.auth);
        if (!playerStats) {
            playerStats = {
                auth: player.auth,
                firstSeen: timestamp,
                lastSeen: timestamp,
                totalConnections: 0,
                uniqueIPs: new Set(),
                recentConnections: [],
                nicknames: new Set()
            };
        }

        // Update stats
        playerStats.lastSeen = timestamp;
        playerStats.totalConnections++;
        playerStats.uniqueIPs.add(decodedIP);
        playerStats.nicknames.add(player.name);

        // Add to recent connections
        const connectionRecord: LocalConnectionData = {
            auth: player.auth,
            nickname: player.name,
            ipAddress: decodedIP,
            country: 'Unknown', // We'll skip geolocation for now
            city: 'Unknown',
            timestamp: timestamp,
            sessionStart: timestamp
        };

        playerStats.recentConnections.push(connectionRecord);
        
        // Keep only recent connections
        if (playerStats.recentConnections.length > MAX_HISTORY) {
            playerStats.recentConnections = playerStats.recentConnections.slice(-MAX_HISTORY);
        }

        // Update the map
        connectionData.set(player.auth, playerStats);

        // Save to localStorage
        saveConnectionData(connectionData);

        window.gameRoom.logger.i('LocalConnectionTracker', 
            `Tracked ${player.name}#${player.id} locally (IP: ${decodedIP}, Total: ${playerStats.totalConnections})`);

    } catch (error) {
        window.gameRoom.logger.e('LocalConnectionTracker', `Error tracking connection: ${error}`);
    }
}

/**
 * Get player analytics from local storage
 */
export function getLocalPlayerAnalytics(auth: string): LocalPlayerStats | null {
    try {
        const connectionData = loadConnectionData();
        return connectionData.get(auth) || null;
    } catch (error) {
        window.gameRoom.logger.e('LocalConnectionTracker', `Error getting analytics: ${error}`);
        return null;
    }
}

/**
 * Get all tracked players
 */
export function getAllTrackedPlayers(): LocalPlayerStats[] {
    try {
        const connectionData = loadConnectionData();
        return Array.from(connectionData.values());
    } catch (error) {
        window.gameRoom.logger.e('LocalConnectionTracker', `Error getting all players: ${error}`);
        return [];
    }
}

/**
 * Clear old data (cleanup function)
 */
export function cleanupOldConnections(daysOld: number = 30): number {
    try {
        const connectionData = loadConnectionData();
        const cutoffTime = getUnixTimestamp() - (daysOld * 24 * 60 * 60 * 1000);
        let cleaned = 0;

        for (const [auth, stats] of connectionData) {
            if (stats.lastSeen < cutoffTime) {
                connectionData.delete(auth);
                cleaned++;
            } else {
                // Clean old connections for active players
                stats.recentConnections = stats.recentConnections.filter(
                    conn => conn.timestamp > cutoffTime
                );
            }
        }

        saveConnectionData(connectionData);
        window.gameRoom.logger.i('LocalConnectionTracker', `Cleaned ${cleaned} old player records`);
        return cleaned;
    } catch (error) {
        window.gameRoom.logger.e('LocalConnectionTracker', `Error cleaning data: ${error}`);
        return 0;
    }
}
