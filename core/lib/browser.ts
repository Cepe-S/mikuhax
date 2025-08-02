import puppeteer from "puppeteer";
import { Player } from "../game/model/GameObject/Player";
import { winstonLogger } from "../winstonLoggerSystem";
import { BrowserHostRoomInitConfig } from "./browser.hostconfig";
import * as dbUtilityInject from "./db.injection";
import { loadStadiumData } from "./stadiumLoader";
import { Server as SIOserver, Socket as SIOsocket } from "socket.io";
import { TeamID } from "../game/model/GameObject/TeamID";
import axios from "axios";
import FormData from "form-data";
import * as Tst from "../game/controller/Translator";
import * as LangRes from "../game/resource/strings";


function typedArrayToBuffer(array: Uint8Array): ArrayBuffer {
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}

/**
* Use this class for control Headless Browser.
* HeadlessBrowser.getInsance()
*/
export class HeadlessBrowser {
    /**
    * Singleton Instance.
    */
    private static instance: HeadlessBrowser;

    /**
    * Container for headless browser.
    */
    private _BrowserContainer: puppeteer.Browser | undefined;
    private _PageContainer: Map<string, puppeteer.Page> = new Map();
    private _SIOserver: SIOserver | undefined;


    /**
    * DO NOT USE THIS CONSTRUCTOR.
    */
    private HeadlessBrowser() { }

    /**
    * Get Singleton Instance.
    */
    public static getInstance(): HeadlessBrowser {
        if (this.instance == null) {
            this.instance = new HeadlessBrowser();
            //this.instance.initBrowser();
        }
        return this.instance;
    }

    /**
    * Launch and init headless browser.
    */
    private async initBrowser() {
        const browserSettings = {
            customArgs: ['--no-sandbox', '--disable-setuid-sandbox']
            , openHeadless: true
        }
        if (process.env.TWEAKS_HEADLESSMODE && JSON.parse(process.env.TWEAKS_HEADLESSMODE.toLowerCase()) === false) {
            browserSettings.openHeadless = false;
        }
        if (process.env.TWEAKS_WEBRTCANOYM && JSON.parse(process.env.TWEAKS_WEBRTCANOYM.toLowerCase()) === false) {
            browserSettings.customArgs.push('--disable-features=WebRtcHideLocalIpsWithMdns');
        }

        //winstonLogger.info("[core] The browser is opened.");

        this._BrowserContainer = await puppeteer.launch({ headless: browserSettings.openHeadless, args: browserSettings.customArgs });

        this._BrowserContainer.on('disconnected', () => {
            //winstonLogger.info("[core] The browser is closed. Core server will open new one automatically.");
            winstonLogger.info("[core] The browser is closed.");
            this._BrowserContainer!.close();
            this._BrowserContainer = undefined;
            //this.initBrowser();
            return;
        });
    }



    /**
    * Get all pages as array.
    */
    private async fetchPages(): Promise<puppeteer.Page[]> {
        return await this._BrowserContainer!.pages();
    }

    /**
    * Close given page.
    */
    private async closePage(ruid: string) {
        await this._PageContainer.get(ruid)?.evaluate(() => {
            window.gameRoom._room.stopRecording(); // suspend recording for prevent memory leak
        });
        await this._PageContainer.get(ruid)?.close(); // close page
        this._PageContainer.delete(ruid); // delete from container
    }

    /**
    * Create new page.
    */
    private async createPage(ruid: string, initConfig: BrowserHostRoomInitConfig): Promise<puppeteer.Page> {
        if (process.env.TWEAKS_GEOLOCATIONOVERRIDE && JSON.parse(process.env.TWEAKS_GEOLOCATIONOVERRIDE.toLowerCase()) === true) {
            initConfig._config.geo = {
                code: process.env.TWEAKS_GEOLOCATIONOVERRIDE_CODE || "AR"
                , lat: parseFloat(process.env.TWEAKS_GEOLOCATIONOVERRIDE_LAT || "-34.6882652")
                , lon: parseFloat(process.env.TWEAKS_GEOLOCATIONOVERRIDE_LON || "-58.5685501")
            } 
        }

        if (!this._BrowserContainer) await this.initBrowser(); // open if browser isn't exist.

        const page: puppeteer.Page = await this._BrowserContainer!.newPage(); // create new page(tab)

        const existPages = await this._BrowserContainer?.pages(); // get exist pages for check if first blank page is exist
        if (existPages?.length == 2 && this._PageContainer.size == 0) existPages[0].close(); // close useless blank page



        page.on('console', (msg: any) => {
            switch (msg.type()) {
                case "log": {
                    winstonLogger.info(`[${ruid}] ${msg.text()}`);
                    break;
                }
                case "info": {
                    winstonLogger.info(`[${ruid}] ${msg.text()}`);
                    break;
                }
                case "error": {
                    winstonLogger.error(`[${ruid}] ${msg.text()}`);
                    break;
                }
                case "warning": {
                    winstonLogger.warn(`[${ruid}] ${msg.text()}`);
                    break;
                }
                default: {
                    winstonLogger.info(`[${ruid}] ${msg.text()}`);
                    break;
                }
            }
        });
        page.on('pageerror', (msg: any) => {
            winstonLogger.error(`[${ruid}] ${msg}`);
        });
        page.on('requestfailed', (msg: any) => {
            winstonLogger.error(`[${ruid}] ${msg.failure().errorText} ${msg.url()}`);
        });
        page.on('close', () => {
            winstonLogger.info(`[core] The page for the game room '${ruid}' is closed.`);
            this._SIOserver?.sockets.emit('roomct', { ruid: ruid }); // emit websocket event for room create/terminate
        });

        await page.goto('https://www.haxball.com/headless', {
            waitUntil: 'networkidle2'
        });

        // convey configuration values via html5 localStorage
        await page.evaluate((initConfig: string, defaultMap: string, readyMap: string) => {
            localStorage.setItem('_initConfig', initConfig);
            localStorage.setItem('_defaultMap', defaultMap);
            localStorage.setItem('_readyMap', readyMap);
        }, JSON.stringify(initConfig), loadStadiumData(initConfig.rules.defaultMapName), loadStadiumData(initConfig.rules.readyMapName));

        // add event listeners ============================================================
        page.addListener('_SIO.Log', (event: any) => {
            this._SIOserver?.sockets.emit('log', { ruid: ruid, origin: event.origin, type: event.type, message: event.message });
        });
        page.addListener('_SIO.InOut', (event: any) => {
            this._SIOserver?.sockets.emit('joinleft', { ruid: ruid, playerID: event.playerID });
        });
        page.addListener('_SIO.StatusChange', (event: any) => {
            this._SIOserver?.sockets.emit('statuschange', { ruid: ruid, playerID: event.playerID });
        });

        // ================================================================================

        // ================================================================================
        // inject some functions ==========================================================
        await page.exposeFunction('_emitSIOLogEvent', (origin: string, type: string, message: string) => {
            page.emit('_SIO.Log', { origin: origin, type: type, message: message });
        });
        await page.exposeFunction('_emitSIOPlayerInOutEvent', (playerID: number) => {
            page.emit('_SIO.InOut', { playerID: playerID });
        });
        await page.exposeFunction('_emitSIOPlayerStatusChangeEvent', (playerID: number) => {
            page.emit('_SIO.StatusChange', { playerID: playerID });
        });


        // inject functions for CRUD with DB Server ====================================
        await page.exposeFunction('_createSuperadminDB', dbUtilityInject.createSuperadminDB);
        await page.exposeFunction('_readSuperadminDB', dbUtilityInject.readSuperadminDB);
        //await page.exposeFunction('updateSuperadminDB', dbUtilityInject.updateSuperadminDB); //this function is not implemented.
        await page.exposeFunction('_deleteSuperadminDB', dbUtilityInject.deleteSuperadminDB);

        await page.exposeFunction('_createPlayerDB', dbUtilityInject.createPlayerDB);
        await page.exposeFunction('_readPlayerDB', dbUtilityInject.readPlayerDB);
        await page.exposeFunction('_updatePlayerDB', dbUtilityInject.updatePlayerDB);
        await page.exposeFunction('_deletePlayerDB', dbUtilityInject.deletePlayerDB);

        await page.exposeFunction('_createBanlistDB', dbUtilityInject.createBanlistDB);
        await page.exposeFunction('_readBanlistDB', dbUtilityInject.readBanlistDB);
        await page.exposeFunction('_updateBanlistDB', dbUtilityInject.updateBanlistDB);
        await page.exposeFunction('_deleteBanlistDB', dbUtilityInject.deleteBanlistDB);
        await page.exposeFunction('_createMatchEventDB', dbUtilityInject.createMatchEventDB);
        await page.exposeFunction('_createMatchSummaryDB', dbUtilityInject.createMatchSummaryDB);
        
        // Top scorers functions
        await page.exposeFunction('_getTopScorersGlobalDB', dbUtilityInject.getTopScorersGlobalDB);
        await page.exposeFunction('_getTopScorersMonthlyDB', dbUtilityInject.getTopScorersMonthlyDB);
        await page.exposeFunction('_getTopScorersDailyDB', dbUtilityInject.getTopScorersDailyDB);
        await page.exposeFunction('_getTopAssistersGlobalDB', dbUtilityInject.getTopAssistersGlobalDB);
        await page.exposeFunction('_getTopAssistersMonthlyDB', dbUtilityInject.getTopAssistersMonthlyDB);
        await page.exposeFunction('_getTopAssistersDailyDB', dbUtilityInject.getTopAssistersDailyDB);
        await page.exposeFunction('_getAllPlayersFromDB', dbUtilityInject.getAllPlayersFromDB);
        
        // inject webhook function
        await page.exposeFunction('_feedSocialDiscordWebhook', this.feedSocialDiscordWebhook.bind(this));
        // ================================================================================

        await page.addScriptTag({ // add and load bot script
            path: './out/bot_bundle.js'
        });

        // Initialize social configuration after bot script loads
        await page.waitForFunction(() => window.gameRoom !== undefined);
        await page.evaluate((webhookConfig: any) => {
            if (window.gameRoom) {
                const discordConfig = webhookConfig?.discord || {};
                window.gameRoom.social = {
                    discordWebhook: {
                        feed: discordConfig.feed || false,
                        url: discordConfig.url || '', // General webhook URL (backward compatibility)
                        replayUrl: discordConfig.replayUrl || '', // Specific URL for replays
                        adminCallUrl: discordConfig.adminCallUrl || '', // Specific URL for admin calls
                        replayUpload: discordConfig.replayUpload || false
                    }
                };
                
                // Log webhook configuration for debugging
                window.gameRoom.logger.i('system', `[Webhook] Configuration loaded - Feed: ${window.gameRoom.social.discordWebhook.feed}, ReplayURL: ${window.gameRoom.social.discordWebhook.replayUrl ? 'configured' : 'not configured'}, AdminCallURL: ${window.gameRoom.social.discordWebhook.adminCallUrl ? 'configured' : 'not configured'}`);
            }
        }, initConfig.webhooks || {});

        await page.waitForFunction(() => window.gameRoom.link !== undefined && window.gameRoom.link.length > 0); // wait for 30secs(default) until room link is created

        this._PageContainer.set(ruid, page) // save container
        this._SIOserver?.sockets.emit('roomct', { ruid: ruid }); // emit websocket event for room create/terminate
        return this._PageContainer.get(ruid)! // return container for support chaining
    }

    /**
    * Get URI link of the room.
    */
    private async fetchRoomURILink(ruid: string): Promise<string> {
        await this._PageContainer.get(ruid)!.waitForFunction(() => window.gameRoom.link !== undefined && window.gameRoom.link.length > 0); // wait for 30secs(default) until room link is created

        let link: string = await this._PageContainer.get(ruid)!.evaluate(() => {
            return window.gameRoom.link;
        });

        return link;
    }

    /**
    * Check if the room exists.
    */
    private isExistRoom(ruid: string): boolean {
        if (this._PageContainer.has(ruid)) return true;
        else return false;
    }

    /**
     * Attach SIO server reference.
     */
    public attachSIOserver(server: SIOserver) {
        //console.log('attached SIO server.' + server);
        this._SIOserver = server;
    }

    /**
    * Check if the room exists.
    */
    public checkExistRoom(ruid: string): boolean {
        if (this.isExistRoom(ruid)) return true;
        else return false;
    }

    /**
    * Open new room.
    */
    public async openNewRoom(ruid: string, initHostRoomConfig: BrowserHostRoomInitConfig) {
        if (this.isExistRoom(ruid)) {
            throw Error(`The room '${ruid}' is already exist.`);
        } else {
            winstonLogger.info(`[core] New game room '${ruid}' will be opened.`);
            await this.createPage(ruid, initHostRoomConfig);
        }
    }

    /**
    * Close the room.
    */
    public async closeRoom(ruid: string) {
        if (this.isExistRoom(ruid)) {
            winstonLogger.info(`[core] The game room '${ruid}' will be closed.`);
            await this.closePage(ruid);
        } else {
            throw Error(`The room '${ruid}' is not exist.`);
        }
    }

    /**
    * Get a link of the game room.
    */
    public async getRoomLink(ruid: string): Promise<string> {
        if (this.isExistRoom(ruid)) {
            return await this.fetchRoomURILink(ruid);
        } else {
            throw Error(`The room '${ruid}' is not exist.`);
        }
    }

    /**
    * Get how many game rooms are exist.
    */
    public getExistRoomNumber(): number {
        return this._PageContainer.size;
    }

    /**
    * Get all list of exist game rooms.
    */
    public getExistRoomList(): string[] {
        return Array.from(this._PageContainer.keys());
    }

    /**
     * Get the game room's information.
     * @param ruid Game room's RUID
     */
    public async getRoomInfo(ruid: string) {
        if (this.isExistRoom(ruid)) {
            return await this._PageContainer.get(ruid)!.evaluate(() => {
                return {
                    roomName: window.gameRoom.config._config.roomName,
                    onlinePlayers: window.gameRoom.playerList.size
                }
            });
        } else {
            throw Error(`The room '${ruid}' is not exist.`);
        }
    }

    /**
     * Get the game room's detail information.
     * @param ruid Game room's RUID
     */
    public async getRoomDetailInfo(ruid: string) {
        if (this.isExistRoom(ruid)) {
            return await this._PageContainer.get(ruid)!.evaluate(() => {
                return {
                    roomName: window.gameRoom.config._config.roomName,
                    onlinePlayers: window.gameRoom.playerList.size,
                    _link: window.gameRoom.link,
                    _roomConfig: window.gameRoom.config._config,
                    _settings: window.gameRoom.config.settings,
                    _rules: window.gameRoom.config.rules,
                    _HElo: window.gameRoom.config.HElo,
                    _commands: window.gameRoom.config.commands
                }
            });
        } else {
            throw Error(`The room '${ruid}' is not exist.`);
        }
    }

    /**
     * Get all ID list of players joinned.
     */
    public async getOnlinePlayersIDList(ruid: string): Promise<number[]> {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            return Array.from(window.gameRoom.playerList.keys());
        });
    }

    /**
     * Check this player is online in the room.
     * @param ruid Room UID
     * @param id Player ID
     */
    public async checkOnlinePlayer(ruid: string, id: number): Promise<boolean> {
        return await this._PageContainer.get(ruid)!.evaluate((id: number) => {
            return window.gameRoom.playerList.has(id);
        }, id);
    }

    /**
     * Get Player's Information
     */
    public async getPlayerInfo(ruid: string, id: number): Promise<Player | undefined> {
        return await this._PageContainer.get(ruid)!.evaluate((id: number) => {
            //let idNum: number = parseInt(id);
            if (window.gameRoom.playerList.has(id)) {
                return window.gameRoom.playerList.get(id);
            } else {
                return undefined;
            }
        }, id);
    }

    /**
     * Kick a online player (fixed-term).
     * @param ruid Room UID
     * @param id Player ID
     * @param message Reason
     * @param seconds Fixed-term ban duration
     */
    public async banPlayerFixedTerm(ruid: string, id: number, ban: boolean, message: string, seconds: number): Promise<void> {
        await this._PageContainer.get(ruid)?.evaluate(async (id: number, ban: boolean, message: string, seconds: number) => {
            if (window.gameRoom.playerList.has(id)) {
                const banItem = {
                    conn: window.gameRoom.playerList.get(id)!.conn,
                    reason: message,
                    register: Math.floor(Date.now()),
                    expire: Math.floor(Date.now()) + (seconds * 1000)
                }
                if (await window._readBanlistDB(window.gameRoom.config._RUID, window.gameRoom.playerList.get(id)!.conn) !== undefined) {
                    //if already exist then update it
                    await window._updateBanlistDB(window.gameRoom.config._RUID, banItem);
                } else {
                    // or create new one
                    await window._createBanlistDB(window.gameRoom.config._RUID, banItem);
                }
                window.gameRoom._room.kickPlayer(id, message, ban);
                window.gameRoom.logger.i('system', `[Kick] #${id} has been ${ban ? 'banned' : 'kicked'} by operator. (duration: ${seconds}secs, reason: ${message})`);
            }
        }, id, ban, message, seconds);
    }

    /**
     * Broadcast text message
     */
    public async broadcast(ruid: string, message: string): Promise<void> {
        await this._PageContainer.get(ruid)?.evaluate((message: string) => {
            window.gameRoom._room.sendAnnouncement(message, null, 0xFFFF00, "bold", 2);
            window.gameRoom.logger.i('system', `[Broadcast] ${message}`);
        }, message);
    }

    /**
     * Send whisper text message
     */
    public async whisper(ruid: string, id: number, message: string): Promise<void> {
        await this._PageContainer.get(ruid)?.evaluate((id: number, message: string) => {
            window.gameRoom._room.sendAnnouncement(message, id, 0xFFFF00, "bold", 2);
            window.gameRoom.logger.i('system', `[Whisper][to ${window.gameRoom.playerList.get(id)?.name}#${id}] ${message}`);
        }, id, message);
    }

    /**
     * Get notice message.
     * @param ruid Game room's UID
     */
    public async getNotice(ruid: string): Promise<string | undefined> {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            if (window.gameRoom.notice) {
                return window.gameRoom.notice;
            } else {
                return undefined;
            }
        });
    }

    /**
     * Set notice message.
     * @param ruid Game room's UID
     * @param message Notice Content
     */
    public async setNotice(ruid: string, message: string): Promise<void> {
        await this._PageContainer.get(ruid)!.evaluate((message: string) => {
            window.gameRoom.notice = message;
        }, message);
    }

    /**
     * Set password of game room.
     * @param ruid Game room's UID
     * @param password Password (null string for disable password)
     */
    public async setPassword(ruid: string, password: string) {
        await this._PageContainer.get(ruid)!.evaluate((password: string) => {
            const convertedPassword: string | null = (password == "") ? null : password;
            window.gameRoom._room.setPassword(convertedPassword);
            window.gameRoom.config._config.password = password;
        }, password);
    }

    /**
     * Get banned words pool for nickname filter
     * @param ruid Game room's UID
     */
    public async getNicknameTextFilteringPool(ruid: string): Promise<string[]> {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            return window.gameRoom.bannedWordsPool.nickname;
        });
    }

    /**
     * Get banned words pool for chat message filter
     * @param ruid Game room's UID
     */
    public async getChatTextFilteringPool(ruid: string): Promise<string[]> {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            return window.gameRoom.bannedWordsPool.chat;
        });
    }

    /**
     * Set banned words pool for nickname filter
     * @param ruid Game room's UID
     * @param pool banned words pool
     */
    public async setNicknameTextFilter(ruid: string, pool: string[]) {
        await this._PageContainer.get(ruid)!.evaluate((pool: string[]) => {
            window.gameRoom.bannedWordsPool.nickname = pool;
        }, pool);
    }

    /**
     * Set banned words pool for chat message filter
     * @param ruid Game room's UID
     * @param pool banned words pool
     */
    public async setChatTextFilter(ruid: string, pool: string[]) {
        await this._PageContainer.get(ruid)!.evaluate((pool: string[]) => {
            window.gameRoom.bannedWordsPool.chat = pool;
        }, pool);
    }

    /**
     * Clear banned words pool for nickname filter
     * @param ruid Game room's UID
     */
    public async clearNicknameTextFilter(ruid: string) {
        await this._PageContainer.get(ruid)!.evaluate(() => {
            window.gameRoom.bannedWordsPool.nickname = [];
        });
    }

    /**
     * Clear banned words pool for chat message filter
     * @param ruid Game room's UID
     */
    public async clearChatTextFilter(ruid: string) {
        await this._PageContainer.get(ruid)!.evaluate(() => {
            window.gameRoom.bannedWordsPool.chat = [];
        });
    }

    /**
     * Check if the game room's chat is muted
     * @param ruid Game room's UID
     * @returns 
     */
    public async getChatFreeze(ruid: string): Promise<boolean> {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            return window.gameRoom.isMuteAll;
        });
    }

    /**
     * Mute or not game room's whole chat
     * @param ruid Game room's UID
     * @param freeze mute or unmute whole chat
     */
    public async setChatFreeze(ruid: string, freeze: boolean) {
        await this._PageContainer.get(ruid)!.evaluate((freeze: boolean) => {
            window.gameRoom.isMuteAll = freeze;
            window.gameRoom.logger.i('system', `[Freeze] Whole chat is ${freeze ? 'muted' : 'unmuted'} by Operator.`);
            window._emitSIOPlayerStatusChangeEvent(0);
        }, freeze);
    }

    /**
     * Mute the player
     * @param ruid ruid Game room's UID
     * @param id player's numeric ID
     * @param muteExpireTime mute expiration time
     */
    public async setPlayerMute(ruid: string, id: number, muteExpireTime: number) {
        await this._PageContainer.get(ruid)!.evaluate((id: number, muteExpireTime: number) => {
            window.gameRoom.playerList.get(id)!.permissions.mute = true;
            window.gameRoom.playerList.get(id)!.permissions.muteExpire = muteExpireTime;

            window.gameRoom.logger.i('system', `[Mute] ${window.gameRoom.playerList.get(id)!.name}#${id} is muted by Operator.`);
            window._emitSIOPlayerStatusChangeEvent(id);
        }, id, muteExpireTime);
    }

    /**
     * Unmute the player
     * @param ruid ruid Game room's UID
     * @param id player's numeric ID
     */
    public async setPlayerUnmute(ruid: string, id: number) {
        await this._PageContainer.get(ruid)!.evaluate((id: number) => {
            window.gameRoom.playerList.get(id)!.permissions.mute = false;

            window.gameRoom.logger.i('system', `[Mute] ${window.gameRoom.playerList.get(id)!.name}#${id} is unmuted by Operator.`);
            window._emitSIOPlayerStatusChangeEvent(id);
        }, id);
    }

    /**
     * Get team colours
     * @param ruid ruid Game room's UID
     * @param team team ID (red 1, blue 2)
     * @returns `angle`, `textColour`, `teamColour1`, `teamColour2`, `teamColour3` as Number
     */
    public async getTeamColours(ruid: string, team: TeamID) {
        return await this._PageContainer.get(ruid)!.evaluate((team: number) => {
            return window.gameRoom.teamColours[team === 1 ? 'red' : 'blue'];
        }, team);
    }

    /**
     * Set team colours
     * @param ruid ruid Game room's UID
     * @param team team ID (red 1, blue 2)
     * @param angle angle for the team color stripes (in degrees)
     * @param textColour color of the player avatars
     * @param teamColour1 first color for the team
     * @param teamColour2 second color for the team
     * @param teamColour3 third color for the team
     */
    public async setTeamColours(ruid: string, team: TeamID, angle: number, textColour: number, teamColour1: number, teamColour2: number, teamColour3: number) {
        await this._PageContainer.get(ruid)!.evaluate((team: number, angle: number, textColour: number, teamColour1: number, teamColour2: number, teamColour3: number) => {
            window.gameRoom._room.setTeamColors(team, angle, textColour, [teamColour1, teamColour2, teamColour3]);

            if (team === 2) {
                window.gameRoom.teamColours.blue = {
                    angle: angle,
                    textColour: textColour,
                    teamColour1: teamColour1,
                    teamColour2: teamColour2,
                    teamColour3: teamColour3,
                }
            } else {
                window.gameRoom.teamColours.red = {
                    angle: angle,
                    textColour: textColour,
                    teamColour1: teamColour1,
                    teamColour2: teamColour2,
                    teamColour3: teamColour3,
                }
            }

            window.gameRoom.logger.i('system', `[TeamColour] New team colour is set for Team ${team}.`);
        }, team, angle, textColour, teamColour1, teamColour2, teamColour3);
    }

    /**
     * Get Discord webhook configuration
     * @param ruid Game room's UID
     */
    public async getDiscordWebhookConfig(ruid: string) {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            return window.gameRoom.social.discordWebhook;
        });
    }

    /**
     * Set Discord webhook configuration
     * @param ruid Game room's UID
     * @param config Webhook configuration
     */
    public async setDiscordWebhookConfig(ruid: string, config: { feed: boolean; url?: string; replayUrl?: string; adminCallUrl?: string; replayUpload: boolean }) {
        await this._PageContainer.get(ruid)!.evaluate((config: any) => {
            window.gameRoom.social.discordWebhook = {
                feed: config.feed,
                url: config.url || '', // Backward compatibility
                replayUrl: config.replayUrl || config.url || '',
                adminCallUrl: config.adminCallUrl || config.url || '',
                replayUpload: config.replayUpload
            };
            window.gameRoom.logger.i('system', `[Webhook] Discord webhook configuration updated.`);
        }, config);
    }

    /**
     * Send webhook to Discord
     * @param webhookUrl Complete Discord webhook URL (can be empty if using separate URLs)
     * @param type Type of webhook (replay, admin_call)
     * @param content Content to send
     */
    private async feedSocialDiscordWebhook(webhookUrl: string, type: string, content: any) {
        // Get the appropriate webhook URL based on type
        let actualWebhookUrl = '';
        
        if (content.ruid) {
            const webhookConfig = await this.getDiscordWebhookConfig(content.ruid);
            
            if (type === 'replay') {
                // For replays, use replayUrl first, then fallback to general url
                actualWebhookUrl = webhookConfig.replayUrl || webhookConfig.url || webhookUrl;
            } else if (type === 'admin_call') {
                // For admin calls, ONLY use adminCallUrl - no fallback to prevent mixing
                actualWebhookUrl = webhookConfig.adminCallUrl || '';
            } else {
                // For other types, use general url
                actualWebhookUrl = webhookConfig.url || webhookUrl;
            }
        } else {
            actualWebhookUrl = webhookUrl;
        }
        
        if (!actualWebhookUrl) {
            winstonLogger.warn(`[webhook] No webhook URL configured for type: ${type}. Please configure the appropriate webhook URL.`);
            return;
        }
        
        winstonLogger.info(`[webhook] Sending ${type} webhook to: ${actualWebhookUrl.substring(0, 50)}...`);
        try {
            if (type === 'replay') {
                const formData = new FormData();
                const detailedMessage = await this.generateDetailedMatchMessage(content.ruid);
                formData.append('content', detailedMessage);
                
                const replayData = typeof content.data === 'string' ? content.data : JSON.stringify(content.data);
                formData.append('file', Buffer.from(replayData), {
                    filename: `replay_${Date.now()}.hbr2`,
                    contentType: 'application/octet-stream'
                });
                
                const response = await axios.post(actualWebhookUrl, formData, {
                    headers: formData.getHeaders(),
                    timeout: 30000
                });
                
                if (response.status === 200 || response.status === 204) {
                    winstonLogger.info(`[webhook] Successfully sent replay to Discord webhook`);
                } else {
                    winstonLogger.warn(`[webhook] Discord webhook responded with status: ${response.status}`);
                }
            } else if (type === 'admin_call') {
                const adminCallMessage = `🚨 **SE NECESITAN ADMINISTRADORES** 🚨\n\n` +
                    `🎮 **Sala:** ${content.roomName}\n` +
                    `🔗 **Link:** ${content.roomLink}\n` +
                    `📝 **Razón:** ${content.reason}\n` +
                    `👤 **Solicitado por:** ${content.callerName} (#${content.callerId})`;
                
                const payload = {
                    content: adminCallMessage
                };
                
                const response = await axios.post(actualWebhookUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                
                if (response.status === 200 || response.status === 204) {
                    winstonLogger.info(`[webhook] Successfully sent admin call to Discord webhook`);
                } else {
                    winstonLogger.warn(`[webhook] Discord webhook responded with status: ${response.status}`);
                }
            }
        } catch (error: any) {
            if (error.response) {
                winstonLogger.error(`[webhook] Discord webhook error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                winstonLogger.error(`[webhook] Error sending Discord webhook: ${error.message}`);
            }
        }
    }

    /**
     * Generate detailed match message for Discord webhook
     * @param ruid Game room's UID
     */
    private async generateDetailedMatchMessage(ruid: string): Promise<string> {
        return await this._PageContainer.get(ruid)!.evaluate(() => {
            const scores = window.gameRoom._room.getScores();
            if (!scores) return '🎮 Repetición de partido';

            const redScore = scores.red;
            const blueScore = scores.blue;
            const matchTime = Math.floor((scores.time || 0) / 60) + ':' + String(Math.floor((scores.time || 0) % 60)).padStart(2, '0');
            
            // Get team names from current match
            const redTeamName = 'RIVER PLATE';
            const blueTeamName = 'BOCA JRS.';
            
            // Get players by team
            const allPlayers = window.gameRoom._room.getPlayerList();
            const redPlayers = allPlayers.filter(p => p.team === 1 && p.id !== 0);
            const bluePlayers = allPlayers.filter(p => p.team === 2 && p.id !== 0);
            
            // Get possession data
            const redPoss = window.gameRoom.ballStack.possCalculate(1);
            const bluePoss = window.gameRoom.ballStack.possCalculate(2);
            
            // Get room configuration
            const roomName = window.gameRoom.config._config.roomName;
            const roomLink = window.gameRoom.link;
            // Extract clean stadium name
            let mapName = 'Estadio Desconocido';
            try {
                const stadiumData = window.gameRoom.stadiumData.default;
                // Remove JavaScript-style comments before parsing JSON
                const cleanedData = stadiumData.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
                const parsed = JSON.parse(cleanedData);
                mapName = parsed.name || 'Estadio Desconocido';
            } catch (e) {
                mapName = 'Estadio Desconocido';
                window.gameRoom.logger.w('system', `[core] Invalid stadium data: ${e.message}`);
            }
            const scoreLimit = window.gameRoom.config.rules.requisite.scoreLimit;
            const timeLimit = Math.floor(window.gameRoom.config.rules.requisite.timeLimit / 60) + ':' + String(window.gameRoom.config.rules.requisite.timeLimit % 60).padStart(2, '0');
            
            // Get admins
            const admins = allPlayers.filter(p => p.admin && p.id !== 0).map(p => p.name).join(', ') || 'Ninguno';
            
            // Find top scorer (MVP)
            let topScorer = 'Ninguno';
            let maxGoals = 0;
            allPlayers.forEach(player => {
                const playerData = window.gameRoom.playerList.get(player.id);
                if (playerData && playerData.matchRecord.goals > maxGoals) {
                    maxGoals = playerData.matchRecord.goals;
                    topScorer = player.name;
                }
            });
            
            // Calculate ball possession in field
            const totalPoss = redPoss + bluePoss;
            const redFieldPoss = totalPoss > 0 ? (redPoss / totalPoss * 100) : 50;
            const blueFieldPoss = totalPoss > 0 ? (bluePoss / totalPoss * 100) : 50;
            
            // Build match events summary with proper scoring tracking
            let eventsSummary = '';
            let currentRedScore = 0;
            let currentBlueScore = 0;
            
            window.gameRoom.matchEventsHolder.forEach((event) => {
                const player = allPlayers.find(p => p.id === event.playerId);
                const playerName = player ? player.name : 'Desconocido';
                const eventTime = Math.floor(event.matchTime / 60) + ':' + String(Math.floor(event.matchTime % 60)).padStart(2, '0');
                
                // Update scores based on event
                if (event.type === 'goal') {
                    if (event.playerTeamId === 1) {
                        currentRedScore++;
                    } else {
                        currentBlueScore++;
                    }
                } else if (event.type === 'ownGoal') {
                    // Own goal scores for the opposite team
                    if (event.playerTeamId === 1) {
                        currentBlueScore++;
                    } else {
                        currentRedScore++;
                    }
                }
                
                // Format event
                eventsSummary += `🟥 ${redTeamName} ${currentRedScore}️⃣\n`;
                eventsSummary += `🟦 ${blueTeamName} ${currentBlueScore}️⃣\n`;
                
                if (event.type === 'goal') {
                    const assist = event.assistPlayerId ? allPlayers.find(p => p.id === event.assistPlayerId)?.name : null;
                    if (assist) {
                        eventsSummary += `🕒 ${eventTime} ⚊ ⚽💥 ¡GOL de ${playerName}! (👥⚽ ¡PASE de ${assist}!)\n\n`;
                    } else {
                        eventsSummary += `🕒 ${eventTime} ⚊ ⚽💥 ¡GOL de ${playerName}!\n\n`;
                    }
                } else if (event.type === 'ownGoal') {
                    eventsSummary += `🕒 ${eventTime} ⚊ 💀 ¡AUTOGOL de ${playerName}!\n\n`;
                }
            });
            
            // Build final message
            let message = `🏆 RESULTADO FINAL:\n` +
                `🟥 ${redTeamName} ${redScore}\n` +
                `🟦 ${blueTeamName} ${blueScore}\n` +
                `Formación ${redTeamName} 🔴\n` +
                `${redPlayers.map(p => p.name).join('\n')}\n` +
                `Formación ${blueTeamName} 🔵\n` +
                `${bluePlayers.map(p => p.name).join('\n')}\n` +
                `🌟 Figura del partido:\n` +
                `${topScorer}\n` +
                `📊 ESTADÍSTICAS\n` +
                `⚽️ Posesión de balón:\n` +
                `🔴 ${redTeamName}: ${redPoss.toFixed(2)}%\n` +
                `🔵 ${blueTeamName}: ${bluePoss.toFixed(2)}%\n\n` +
                `🔄 Pelota en campo:\n` +
                `🔴 ${redTeamName}: ${redFieldPoss.toFixed(0)}%\n` +
                `🔵 ${blueTeamName}: ${blueFieldPoss.toFixed(0)}%\n\n` +
                `⏰ Tiempo Jugado: ${matchTime}\n` +
                `🛠️ CONFIGURACIÓN\n` +
                `🎮 Nombre de la Sala:\n` +
                `${roomName}\n\n` +
                `👑 Administradores: ${admins}\n\n` +
                `📍 Ubicación del Host: Argentina 🇦🇷\n\n` +
                `🔗 Link de la Sala:\n` +
                `${roomLink}\n\n` +
                `🏟️ Mapa Colocado: ${mapName}\n\n` +
                `⚽️ Límite de Goles: ${scoreLimit}\n\n` +
                `⏱️ Límite de Tiempo: ${timeLimit}\n` +
                `📜 RESUMEN DEL PARTIDO:\n` +
                `${eventsSummary}`;
            
            // Truncate message if it exceeds Discord's 2000 character limit
            if (message.length > 2000) {
                message = message.substring(0, 1997) + '...';
            }
            
            return message;
        });
    }

}


