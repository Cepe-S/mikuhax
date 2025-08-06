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
        window.gameRoom.logger.i('LocalConnectionTracker', `Loading data from localStorage with key: ${STORAGE_KEY}`);
        
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            window.gameRoom.logger.i('LocalConnectionTracker', 'No stored data found, returning empty map');
            return new Map();
        }

        window.gameRoom.logger.i('LocalConnectionTracker', `Found stored data, size: ${stored.length} characters`);

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

        window.gameRoom.logger.i('LocalConnectionTracker', `Loaded ${result.size} players from localStorage`);
        return result;
    } catch (error) {
        window.gameRoom.logger.w('LocalConnectionTracker', `Failed to load data: ${error}`);
        window.gameRoom.logger.w('LocalConnectionTracker', `Error details: ${error.message}`);
        return new Map();
    }
}

/**
 * Save connection data to localStorage
 */
function saveConnectionData(data: Map<string, LocalPlayerStats>): void {
    try {
        window.gameRoom.logger.i('LocalConnectionTracker', `Saving ${data.size} players to localStorage`);
        
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

        const dataToStore = JSON.stringify(toSave);
        window.gameRoom.logger.i('LocalConnectionTracker', `Data size: ${dataToStore.length} characters`);
        
        localStorage.setItem(STORAGE_KEY, dataToStore);
        window.gameRoom.logger.i('LocalConnectionTracker', `Successfully saved data to localStorage with key: ${STORAGE_KEY}`);
        
        // Verify data was saved
        const verification = localStorage.getItem(STORAGE_KEY);
        if (verification) {
            window.gameRoom.logger.i('LocalConnectionTracker', `Verification: Data exists in localStorage, size: ${verification.length}`);
        } else {
            window.gameRoom.logger.w('LocalConnectionTracker', `Verification failed: No data found in localStorage`);
        }
        
    } catch (error) {
        window.gameRoom.logger.w('LocalConnectionTracker', `Failed to save data: ${error}`);
        window.gameRoom.logger.w('LocalConnectionTracker', `Error details: ${error.message}`);
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
        // Add debug logging
        window.gameRoom.logger.i('LocalConnectionTracker', `Starting to track ${player.name} with auth: ${player.auth}, conn: ${player.conn}`);
        
        const timestamp = getUnixTimestamp();
        window.gameRoom.logger.i('LocalConnectionTracker', `Timestamp: ${timestamp}`);
        
        const decodedIP = decodeIP(player.conn);
        window.gameRoom.logger.i('LocalConnectionTracker', `Decoded IP: ${decodedIP} from conn: ${player.conn}`);
        
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
            window.gameRoom.logger.e('LocalConnectionTracker', 'localStorage is not available in this environment');
            return;
        }
        
        // Load existing data
        const connectionData = loadConnectionData();
        window.gameRoom.logger.i('LocalConnectionTracker', `Loaded ${connectionData.size} existing players from storage`);
        
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
            window.gameRoom.logger.i('LocalConnectionTracker', `Created new stats for ${player.name}`);
        } else {
            window.gameRoom.logger.i('LocalConnectionTracker', `Found existing stats for ${player.name} with ${playerStats.totalConnections} connections`);
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
        window.gameRoom.logger.i('LocalConnectionTracker', `Updated map, now has ${connectionData.size} players`);

        // Save to localStorage
        saveConnectionData(connectionData);
        window.gameRoom.logger.i('LocalConnectionTracker', `Data saved to localStorage`);

        window.gameRoom.logger.i('LocalConnectionTracker', 
            `Tracked ${player.name}#${player.id} locally (IP: ${decodedIP}, Total: ${playerStats.totalConnections})`);

    } catch (error) {
        window.gameRoom.logger.e('LocalConnectionTracker', `Error tracking connection: ${error}`);
        window.gameRoom.logger.e('LocalConnectionTracker', `Error stack: ${error.stack}`);
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

/**
 * Debug function to test localStorage functionality
 */
export function testLocalStorage(): void {
    try {
        window.gameRoom.logger.i('LocalConnectionTracker', 'Testing localStorage functionality...');
        
        // Test basic localStorage access
        if (typeof localStorage === 'undefined') {
            window.gameRoom.logger.e('LocalConnectionTracker', 'localStorage is not available');
            return;
        }
        
        // Test write
        const testKey = 'haxbotron_test';
        const testData = { test: 'data', timestamp: Date.now() };
        localStorage.setItem(testKey, JSON.stringify(testData));
        window.gameRoom.logger.i('LocalConnectionTracker', 'Test data written to localStorage');
        
        // Test read
        const readData = localStorage.getItem(testKey);
        if (readData) {
            const parsed = JSON.parse(readData);
            window.gameRoom.logger.i('LocalConnectionTracker', `Test data read successfully: ${JSON.stringify(parsed)}`);
        } else {
            window.gameRoom.logger.w('LocalConnectionTracker', 'Failed to read test data');
        }
        
        // Clean up
        localStorage.removeItem(testKey);
        window.gameRoom.logger.i('LocalConnectionTracker', 'Test completed and cleaned up');
        
        // Show current stored data
        const currentData = localStorage.getItem(STORAGE_KEY);
        if (currentData) {
            window.gameRoom.logger.i('LocalConnectionTracker', `Current connection data size: ${currentData.length} characters`);
            try {
                const parsed = JSON.parse(currentData);
                const playerCount = Object.keys(parsed).length;
                window.gameRoom.logger.i('LocalConnectionTracker', `Current players stored: ${playerCount}`);
            } catch (e) {
                window.gameRoom.logger.w('LocalConnectionTracker', 'Failed to parse current data');
            }
        } else {
            window.gameRoom.logger.i('LocalConnectionTracker', 'No connection data currently stored');
        }
        
    } catch (error) {
        window.gameRoom.logger.e('LocalConnectionTracker', `localStorage test failed: ${error}`);
    }
}
