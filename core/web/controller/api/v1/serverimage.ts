import { Context } from "koa";
import { HeadlessBrowser } from "../../../../lib/browser";
import { BrowserHostRoomInitConfig } from '../../../../lib/browser.hostconfig';
import { ServerImage, DeployRequest } from "../../../model/ServerImage";
import { createImageSchema, deployRequestSchema } from "../../../schema/serverimage.validation";
import Joi from 'joi';
import fs from 'fs';
import path from 'path';

const browser = HeadlessBrowser.getInstance();
const IMAGES_DIR = path.join(process.cwd(), 'server-images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Create server image directly from form data
 */
export async function createServerImage(ctx: Context) {
    const validationResult = createImageSchema.validate(ctx.request.body);
    if (validationResult.error) {
        ctx.status = 400;
        ctx.body = { error: validationResult.error.details[0].message };
        return;
    }
    
    try {
        const serverImage: ServerImage = ctx.request.body;
        
        const imageId = `${serverImage.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const imagePath = path.join(IMAGES_DIR, `${imageId}.json`);
        
        fs.writeFileSync(imagePath, JSON.stringify(serverImage, null, 2));

        ctx.status = 201;
        ctx.body = { imageId, message: 'Server image created successfully' };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to create server image' };
    }
}

/**
 * Create server image from existing room configuration
 */
export async function createServerImageFromRoom(ctx: Context) {
    const { ruid: paramRuid } = ctx.params;
    
    const validationResult = Joi.object().keys({
        name: Joi.string().required().min(1).max(100),
        description: Joi.string().required().min(1).max(500)
    }).validate(ctx.request.body);
    
    if (validationResult.error) {
        ctx.status = 400;
        ctx.body = { error: validationResult.error.details[0].message };
        return;
    }
    
    const { name, description } = ctx.request.body;
    const ruid = paramRuid;

    if (!browser.checkExistRoom(ruid)) {
        ctx.status = 404;
        ctx.body = { error: 'Room not found' };
        return;
    }

    try {
        const roomDetailInfo = await browser.getRoomDetailInfo(ruid);
        
        // Get superadmins from database
        const superadmins = await browser.getAllSuperadmins(ruid) || [];
        
        const serverImage: ServerImage = {
            name,
            description,
            ruid,
            version: "1.0.0",
            createdAt: new Date(),
            superadmins,
            config: {
                roomName: roomDetailInfo._roomConfig.roomName,
                playerName: roomDetailInfo._roomConfig.playerName,
                password: roomDetailInfo._roomConfig.password,
                maxPlayers: roomDetailInfo._roomConfig.maxPlayers,
                public: roomDetailInfo._roomConfig.public,
                noPlayer: roomDetailInfo._roomConfig.noPlayer,
                geo: roomDetailInfo._roomConfig.geo
            },
            settings: {
                ...roomDetailInfo._settings,
                balanceEnabled: roomDetailInfo._settings.balanceEnabled ?? true,
                balanceMode: roomDetailInfo._settings.balanceMode ?? 'jt',
                balanceMaxPlayersPerTeam: roomDetailInfo._settings.balanceMaxPlayersPerTeam ?? 4
            },
            rules: roomDetailInfo._rules,
            helo: roomDetailInfo._HElo,
            commands: roomDetailInfo._commands,
            stadiums: {
                default: roomDetailInfo._rules.defaultMapName,
                ready: roomDetailInfo._rules.readyMapName
            },
            webhooks: {
                discord: await browser.getDiscordWebhookConfig(ruid)
            }
        };

        const imageId = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const imagePath = path.join(IMAGES_DIR, `${imageId}.json`);
        
        fs.writeFileSync(imagePath, JSON.stringify(serverImage, null, 2));

        ctx.status = 201;
        ctx.body = { imageId, message: 'Server image created successfully' };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to create server image' };
    }
}

/**
 * List all server images with running status
 */
export async function listServerImages(ctx: Context) {
    try {
        console.log('Starting listServerImages...');
        const files = fs.readdirSync(IMAGES_DIR).filter(file => file.endsWith('.json'));
        console.log(`Found ${files.length} image files`);
        
        const images = await Promise.all(files.map(async (file, index) => {
            try {
                console.log(`Processing file ${index + 1}/${files.length}: ${file}`);
                const imagePath = path.join(IMAGES_DIR, file);
                const imageData: ServerImage = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
                console.log(`Parsed image data for ${file}, name: ${imageData.name}`);
                
                const isRunning = browser.checkExistRoom(imageData.ruid);
                console.log(`Room ${imageData.ruid} running status: ${isRunning}`);
                
                let roomInfo = null;
                if (isRunning) {
                    try {
                        const roomDetail = await browser.getRoomDetailInfo(imageData.ruid);
                        const playersList = await browser.getOnlinePlayersIDList(imageData.ruid);
                        const playersInfo = await Promise.all(
                            playersList.map(id => browser.getPlayerInfo(imageData.ruid, id))
                        );
                        const admins = playersInfo.filter(p => p && p.admin).length;
                        
                        roomInfo = {
                            link: roomDetail._link,
                            onlinePlayers: roomDetail.onlinePlayers,
                            admins: admins
                        };
                    } catch (error) {
                        console.log(`Error getting room info for ${imageData.ruid}:`, error);
                        // If we can't get room info, just mark as running without details
                        roomInfo = {
                            link: 'Error loading link',
                            onlinePlayers: 0,
                            admins: 0
                        };
                    }
                }
                
                return {
                    id: file.replace('.json', ''),
                    name: imageData.name || 'Unnamed',
                    description: imageData.description || '',
                    ruid: imageData.ruid,
                    version: imageData.version || '1.0.0',
                    createdAt: imageData.createdAt || new Date(),
                    isRunning,
                    roomInfo
                };
            } catch (fileError) {
                console.error(`Error processing file ${file}:`, fileError);
                // Return a fallback object for corrupted files
                return {
                    id: file.replace('.json', ''),
                    name: `Error loading ${file}`,
                    description: 'Failed to load image data',
                    ruid: 'ERROR',
                    version: '1.0.0',
                    createdAt: new Date(),
                    isRunning: false,
                    roomInfo: null
                };
            }
        }));

        console.log(`Successfully processed ${images.length} images`);

        // Sort images: running first, then by creation date
        images.sort((a, b) => {
            if (a.isRunning && !b.isRunning) return -1;
            if (!a.isRunning && b.isRunning) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        ctx.status = 200;
        ctx.body = images;
    } catch (error) {
        console.error('Error in listServerImages:', error);
        ctx.status = 500;
        ctx.body = { error: 'Failed to list server images', details: error.message };
    }
}

/**
 * Get server image details
 */
export function getServerImage(ctx: Context) {
    const { imageId } = ctx.params;
    const imagePath = path.join(IMAGES_DIR, `${imageId}.json`);

    if (!fs.existsSync(imagePath)) {
        ctx.status = 404;
        ctx.body = { error: 'Server image not found' };
        return;
    }

    try {
        const imageData: ServerImage = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
        ctx.status = 200;
        ctx.body = imageData;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to read server image' };
    }
}

/**
 * Deploy server from image
 */
export async function deployFromImage(ctx: Context) {
    const validationResult = deployRequestSchema.validate(ctx.request.body);
    if (validationResult.error) {
        ctx.status = 400;
        ctx.body = { error: validationResult.error.details[0].message };
        return;
    }
    
    const deployRequest: DeployRequest = ctx.request.body;

    const imagePath = path.join(IMAGES_DIR, `${deployRequest.imageId}.json`);

    if (!fs.existsSync(imagePath)) {
        ctx.status = 404;
        ctx.body = { error: 'Server image not found' };
        return;
    }

    try {
        const imageData: ServerImage = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
        
        if (browser.checkExistRoom(imageData.ruid)) {
            ctx.status = 409;
            ctx.body = { error: 'Room already exists' };
            return;
        }
        
        // Apply overrides if provided
        const config = { ...imageData.config, token: deployRequest.token };
        if (deployRequest.overrides) {
            if (deployRequest.overrides.roomName) config.roomName = deployRequest.overrides.roomName;
            if (deployRequest.overrides.password !== undefined) config.password = deployRequest.overrides.password;
            if (deployRequest.overrides.maxPlayers) config.maxPlayers = deployRequest.overrides.maxPlayers;
            if (deployRequest.overrides.public !== undefined) config.public = deployRequest.overrides.public;
        }

        const newRoomConfig: BrowserHostRoomInitConfig = {
            _LaunchDate: new Date(),
            _RUID: imageData.ruid,
            _config: config,
            settings: imageData.settings,
            rules: {
                ...imageData.rules,
                requisite: {
                    ...imageData.rules.requisite,
                    maxSubPlayers: imageData.rules.requisite.maxSubPlayers ?? 0
                },
                balanceMode: 'jt' // Default balance mode
            },
            HElo: imageData.helo,
            commands: imageData.commands,
            webhooks: imageData.webhooks
        };

        if (newRoomConfig._config.password === "") {
            newRoomConfig._config.password = undefined;
        }

        await browser.openNewRoom(imageData.ruid, newRoomConfig);
        
        // Restore superadmins if present in image
        if (imageData.superadmins && imageData.superadmins.length > 0) {
            for (const superadmin of imageData.superadmins) {
                try {
                    await browser.createSuperadmin(imageData.ruid, superadmin.key, superadmin.description);
                } catch (error) {
                    console.log(`Superadmin ${superadmin.key} already exists or failed to create:`, error);
                }
            }
        }
        
        // Configure webhooks if present in image
        if (imageData.webhooks?.discord) {
            await browser.setDiscordWebhookConfig(imageData.ruid, {
                replayUrl: imageData.webhooks.discord.replayUrl || '',
                adminCallUrl: imageData.webhooks.discord.adminCallUrl || '',
                serverStatusUrl: imageData.webhooks.discord.serverStatusUrl || '',
                dailyStatsUrl: imageData.webhooks.discord.dailyStatsUrl || '',
                dailyStatsTime: imageData.webhooks.discord.dailyStatsTime || '20:00',
                replayUpload: imageData.webhooks.discord.replayUpload
            });
        }
        
        ctx.status = 201;
        ctx.body = { 
            message: 'Server deployed successfully',
            ruid: imageData.ruid,
            imageId: deployRequest.imageId
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to deploy server from image' };
    }
}

/**
 * Delete server image
 */
export function deleteServerImage(ctx: Context) {
    const { imageId } = ctx.params;
    const imagePath = path.join(IMAGES_DIR, `${imageId}.json`);

    if (!fs.existsSync(imagePath)) {
        ctx.status = 404;
        ctx.body = { error: 'Server image not found' };
        return;
    }

    try {
        fs.unlinkSync(imagePath);
        ctx.status = 204;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to delete server image' };
    }
}