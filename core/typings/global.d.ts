import { Logger } from "../game/controller/Logger";
import { RoomConfig } from '../game/model/RoomObject/RoomConfig';
import { KickStack } from "../game/model/GameObject/BallTrace";
import { AdminKickTrace } from "../game/model/PlayerBan/AdminKickTrace";
import { Player } from "../game/model/GameObject/Player";
import { GameRoomConfig } from "../game/model/Configuration/GameRoomConfig";
import { TeamID } from "../game/model/GameObject/TeamID";
import { Room } from "../game/model/RoomObject/RoomObject";
import { BanList } from "../game/model/PlayerBan/BanList";
import { PlayerStorage } from "../game/model/GameObject/PlayerObject";
import { MatchEvent } from "../game/model/GameObject/MatchEvent";
import { MatchEventHolder } from "../game/model/GameObject/MatchEventHolder";
import { MatchSummary } from "../game/model/GameObject/MatchSummary";

declare global {
    interface Window {
        // ==============================
        // Bot main state and config

        gameRoom: {
            _room: Room;
            config: GameRoomConfig;
            link: string;
            social: {
                discordWebhook: {
                    replayUrl: string;
                    adminCallUrl: string;
                    serverStatusUrl: string;
                    dailyStatsUrl: string;
                    dailyStatsTime: string;
                    replayUpload: boolean;
                }
            };
            stadiumData: {
                default: string;
                training: string;
            };
            bannedWordsPool: {
                nickname: string[];
                chat: string[];
            };
            teamColours: {
                red: {
                    angle: number;
                    textColour: number;
                    teamColour1: number;
                    teamColour2: number;
                    teamColour3: number;
                };
                blue: {
                    angle: number;
                    textColour: number;
                    teamColour1: number;
                    teamColour2: number;
                    teamColour3: number;
                };
            };
            logger: Logger;
            isStatRecord: boolean;
            isGamingNow: boolean;
            isMuteAll: boolean;
            playerList: Map<number, Player>;
            ballStack: KickStack;
            banVoteCache: number[];
            winningStreak: {
                count: number;
                teamID: TeamID;
            };
            antiTrollingOgFloodCount: number[];
            antiTrollingChatFloodCount: { playerID: number; timestamp: number }[];
            antiInsufficientStartAbusingCount: number[];
            antiPlayerKickAbusingCount: AdminKickTrace[];
            notice: string;
            onEmergency: {
                list(): void;
                chat(msg: string, playerID?: number): void;
                kick(playerID: number, msg?: string): void;
                ban(playerID: number, msg?: string): void;
                password(password?: string): void;
            };
            matchEventsHolder: MatchEventHolder[]
        };

        // ==============================
        // INJECTED from Core Server
        _emitSIOLogEvent(origin: string, type: string, message: string): void;
        _emitSIOPlayerInOutEvent(playerID: number): void;
        _emitSIOPlayerStatusChangeEvent(playerID: number): void;
        _feedSocialDiscordWebhook(webhookUrl: string, type: string, content: any): void;
        // CRUD with DB Server via REST API
        _createPlayerDB(ruid: string, player: PlayerStorage): Promise<void>;
        _readPlayerDB(ruid: string, playerAuth: string): Promise<PlayerStorage | undefined>;
        _updatePlayerDB(ruid: string, player: PlayerStorage): Promise<void>;
        _deletePlayerDB(ruid: string, playerAuth: string): Promise<void>;
        _createBanlistDB(ruid: string, banList: BanList): Promise<void>;
        _readBanlistDB(ruid: string, playerConn: string): Promise<BanList | undefined>;
        _updateBanlistDB(ruid: string, banList: BanList): Promise<void>;
        _deleteBanlistDB(ruid: string, playerConn: string): Promise<void>;
        _createSuperadminDB(ruid: string, key: string, description: string): Promise<void>;
        _readSuperadminDB(ruid: string, key: string): Promise<string | undefined>;
        _deleteSuperadminDB(ruid: string, key: string): Promise<void>;
        // Match Event/Match Summary DB
        _createMatchEventDB(ruid: string, matchEvent: MatchEvent): Promise<void>;
        _createMatchSummaryDB(ruid: string, matchSummary: MatchSummary): Promise<void>;
        // Top Scorers DB
        _getTopScorersGlobalDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
        _getTopScorersMonthlyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
        _getTopScorersDailyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
        // Top Assisters DB
        _getTopAssistersGlobalDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
        _getTopAssistersMonthlyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
        _getTopAssistersDailyDB(ruid: string): Promise<{playerId: number, playerName: string, count: number}[]>;
        // Get all players from DB
        _getAllPlayersFromDB(ruid: string): Promise<PlayerStorage[]>;

        // ==============================
        // Haxball Headless Initial Methods
        HBInit(config: RoomConfig): Room;
        onHBLoaded(): void;
        // ==============================
    }
}
