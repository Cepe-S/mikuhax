import { PlayerObject } from "../model/GameObject/PlayerObject";
import { getUnixTimestamp } from "./Statistics";
import { trackConnectionToDB, getConnectionAnalyticsFromDB } from "./Storage";
import axios from 'axios';

/**
 * Decode IP address if it's in hexadecimal format
 * Haxball sometimes sends IPs as hex strings
 */
function decodeIP(conn: string): string {
    // Check if it looks like a hex string (only hex characters and proper length)
    if (/^[0-9A-Fa-f]+$/.test(conn) && conn.length >= 8) {
        try {
            // Try to decode as ASCII hex first (most common case for Haxball)
            // For hex string like "3138312E3131372E38302E3330"
            // This represents ASCII encoded IP like "181.117.80.0"
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
            // If decoding fails, return original
        }
    }
    
    // If not hex or decoding failed, check if it's already a valid IP
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(conn)) {
        return conn;
    }
    
    return conn;
}

/**
 * Track player connection and update anti-spam data
 * Uses CPU-optimized fast update operations for minimal performance impact
 */
export async function trackPlayerConnection(player: PlayerObject): Promise<void> {
    try {
        const timestamp = getUnixTimestamp();
        const ruid = 'game_room'; // Default identifier for now
        
        // Decode IP if it's in hex format (Haxball sometimes sends IPs as hex)
        const decodedIP = decodeIP(player.conn);
        
        // Get IP location data (cache results to avoid repeated API calls)
        const ipData = await getIPLocation(decodedIP);
        
        // Prepare connection data
        const connectionData = {
            auth: player.auth,
            nickname: player.name,
            ipAddress: decodedIP, // Use decoded IP
            timestamp: timestamp,
            ruid: ruid,
            eventType: 'join' as const,
            country: ipData.country,
            city: ipData.city,
            isp: ipData.isp
        };

        // For now, just log the connection data instead of sending to API
        // This avoids CORS and Private Network Access issues
        window.gameRoom.logger.i('ConnectionTracker', `Connection data: ${JSON.stringify({
            auth: connectionData.auth,
            nickname: connectionData.nickname,
            ipAddress: connectionData.ipAddress,
            country: connectionData.country,
            city: connectionData.city,
            timestamp: new Date(connectionData.timestamp).toLocaleString()
        })}`);

        // Send to database using injected functions (no HTTP/CORS issues)
        trackConnectionToDB({
            auth: connectionData.auth,
            nickname: connectionData.nickname,
            ipAddress: connectionData.ipAddress,
            timestamp: connectionData.timestamp,
            eventType: 'join',
            country: connectionData.country,
            city: connectionData.city,
            isp: connectionData.isp
        }).catch(err => {
            window.gameRoom.logger.w('ConnectionTracker', `Failed to save connection to DB: ${err.message || err}`);
        });

        window.gameRoom.logger.i('ConnectionTracker', `Tracked ${player.name}#${player.id} connection from ${ipData.country} (IP: ${decodedIP})`);

    } catch (error) {
        window.gameRoom.logger.e('ConnectionTracker', `Error tracking connection: ${error}`);
    }
}

/**
 * Cache for IP location data to avoid repeated API calls
 */
const ipLocationCache = new Map<string, { country: string; city: string; isp: string; timestamp: number }>();

/**
 * Get IP location data with caching (24 hour cache)
 */
async function getIPLocation(conn: string): Promise<{ country: string; city: string; isp: string }> {
    // Check cache first
    const cached = ipLocationCache.get(conn);
    if (cached && (getUnixTimestamp() - cached.timestamp) < 86400000) { // 24 hours
        return { country: cached.country, city: cached.city, isp: cached.isp };
    }

    // Try primary API first (ipapi.co)
    try {
        const response = await axios.get(`https://ipapi.co/${conn}/json/`, {
            timeout: 3000
        });

        if (response.data && !response.data.error) {
            const result = {
                country: response.data.country_name || 'Unknown',
                city: response.data.city || 'Unknown',
                isp: response.data.org || 'Unknown'
            };

            // Cache the result
            ipLocationCache.set(conn, {
                ...result,
                timestamp: getUnixTimestamp()
            });

            return result;
        }
    } catch (error) {
        window.gameRoom.logger.w('ConnectionTracker', `Primary IP API failed for ${conn}, trying fallback: ${error}`);
    }

    // Try fallback API (ip-api.com with HTTPS)
    try {
        const response = await axios.get(`https://ipapi.com/ip_api.php?ip=${conn}`, {
            timeout: 3000,
            headers: {
                'User-Agent': 'HaxbotronTracker/1.0'
            }
        });

        if (response.data) {
            const result = {
                country: response.data.country_name || 'Unknown',
                city: response.data.city || 'Unknown',
                isp: response.data.isp || 'Unknown'
            };

            // Cache the result
            ipLocationCache.set(conn, {
                ...result,
                timestamp: getUnixTimestamp()
            });

            return result;
        }
    } catch (error) {
        window.gameRoom.logger.w('ConnectionTracker', `Fallback IP API also failed for ${conn}: ${error}`);
    }

    // Default values if all APIs fail
    return { country: 'Unknown', city: 'Unknown', isp: 'Unknown' };
}

/**
 * Send connection data to database API
 */
async function updateConnectionData(data: any): Promise<void> {
    try {
        // Use a default URL since process.env is not available in browser context
        const dbServerUrl = 'http://localhost:13001';
        
        await axios.post(`${dbServerUrl}/api/v1/connections`, data, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        // Log but don't throw - we don't want connection tracking to break the game
        window.gameRoom.logger.w('ConnectionTracker', `Failed to send data to DB API: ${error}`);
    }
}

/**
 * Get connection analytics for a player (used by admin commands)
 */
export async function getPlayerConnectionAnalytics(auth: string): Promise<any> {
    try {
        // Use injected function instead of HTTP to avoid CORS issues
        return await getConnectionAnalyticsFromDB(auth);

    } catch (error) {
        window.gameRoom.logger.e('ConnectionTracker', `Failed to get analytics: ${error}`);
        return null;
    }
}

/**
 * Check if a player should be flagged as suspicious based on connection patterns
 */
export async function checkSuspiciousActivity(auth: string): Promise<boolean> {
    try {
        const analytics = await getPlayerConnectionAnalytics(auth);
        
        if (!analytics) return false;

        // Flag as suspicious if:
        // - Multiple IPs in short time (possible VPN switching)
        // - High rejoin count
        // - Multiple countries
        return analytics.hasMultipleIPs && 
               analytics.rejoinCount > 10 && 
               analytics.uniqueCountries > 3;

    } catch (error) {
        return false;
    }
}
