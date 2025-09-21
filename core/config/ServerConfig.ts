// Backend: Simple server configuration system
export interface ServerConfig {
    serverName: string;
    maxPlayers: number;
    password?: string;
    scoreLimit: number;
    timeLimit: number;
    defaultStadium: string;
    autoStart: boolean;
    teamLock: boolean;
    dbEnabled: boolean;
    commandsEnabled: string[];
}

export const DEFAULT_CONFIG: ServerConfig = {
    serverName: "Haxbotron Server",
    maxPlayers: 16,
    scoreLimit: 3,
    timeLimit: 3,
    defaultStadium: "Classic",
    autoStart: true,
    teamLock: false,
    dbEnabled: true,
    commandsEnabled: ["help", "stats", "list", "afk", "discord"]
};

export function loadConfigFromImage(imagePath: string): ServerConfig {
    try {
        const fs = require('fs');
        if (fs.existsSync(imagePath)) {
            const imageData = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
            return { ...DEFAULT_CONFIG, ...imageData.config };
        }
    } catch (error) {
        console.log('Using default config:', error);
    }
    return DEFAULT_CONFIG;
}