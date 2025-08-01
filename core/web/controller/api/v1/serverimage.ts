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
    const { ruid } = ctx.params;
    
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

    if (!browser.checkExistRoom(ruid)) {
        ctx.status = 404;
        ctx.body = { error: 'Room not found' };
        return;
    }

    try {
        const roomDetailInfo = await browser.getRoomDetailInfo(ruid);
        
        const serverImage: ServerImage = {
            name,
            description,
            version: "1.0.0",
            createdAt: new Date(),
            config: {
                roomName: roomDetailInfo._roomConfig.roomName,
                playerName: roomDetailInfo._roomConfig.playerName,
                password: roomDetailInfo._roomConfig.password,
                maxPlayers: roomDetailInfo._roomConfig.maxPlayers,
                public: roomDetailInfo._roomConfig.public,
                noPlayer: roomDetailInfo._roomConfig.noPlayer,
                geo: roomDetailInfo._roomConfig.geo
            },
            settings: roomDetailInfo._settings,
            rules: roomDetailInfo._rules,
            helo: roomDetailInfo._HElo,
            commands: roomDetailInfo._commands,
            stadiums: {
                default: roomDetailInfo._rules.defaultMapName,
                ready: roomDetailInfo._rules.readyMapName
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
 * List all server images
 */
export function listServerImages(ctx: Context) {
    try {
        const files = fs.readdirSync(IMAGES_DIR).filter(file => file.endsWith('.json'));
        const images = files.map(file => {
            const imagePath = path.join(IMAGES_DIR, file);
            const imageData: ServerImage = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
            return {
                id: file.replace('.json', ''),
                name: imageData.name,
                description: imageData.description,
                version: imageData.version,
                createdAt: imageData.createdAt
            };
        });

        ctx.status = 200;
        ctx.body = images;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to list server images' };
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

    if (browser.checkExistRoom(deployRequest.ruid)) {
        ctx.status = 409;
        ctx.body = { error: 'Room already exists' };
        return;
    }

    try {
        const imageData: ServerImage = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
        
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
            _RUID: deployRequest.ruid,
            _config: config,
            settings: imageData.settings,
            rules: imageData.rules,
            HElo: imageData.helo,
            commands: imageData.commands
        };

        if (newRoomConfig._config.password === "") {
            newRoomConfig._config.password = undefined;
        }

        await browser.openNewRoom(deployRequest.ruid, newRoomConfig);
        
        ctx.status = 201;
        ctx.body = { 
            message: 'Server deployed successfully',
            ruid: deployRequest.ruid,
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