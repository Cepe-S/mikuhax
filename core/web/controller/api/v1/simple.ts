// Backend API: Simple server image management
import { Context } from 'koa';
import * as fs from 'fs';
import * as path from 'path';

const IMAGES_DIR = path.join(__dirname, '../../../../server-images');

export async function getServerImages(ctx: Context) {
    try {
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }
        
        const files = fs.readdirSync(IMAGES_DIR);
        const images = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                try {
                    const filePath = path.join(IMAGES_DIR, file);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        id: file.replace('.json', ''),
                        name: data.name || file,
                        config: data.config || {},
                        active: data.active || false
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
        
        ctx.body = images;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to load images' };
    }
}

export async function activateServerImage(ctx: Context) {
    try {
        const { imageId } = ctx.params;
        const imagePath = path.join(IMAGES_DIR, `${imageId}.json`);
        
        if (!fs.existsSync(imagePath)) {
            ctx.status = 404;
            ctx.body = { error: 'Image not found' };
            return;
        }
        
        // Deactivate all images
        const files = fs.readdirSync(IMAGES_DIR);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const filePath = path.join(IMAGES_DIR, file);
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    data.active = false;
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                } catch {}
            }
        });
        
        // Activate selected image
        const imageData = JSON.parse(fs.readFileSync(imagePath, 'utf8'));
        imageData.active = true;
        fs.writeFileSync(imagePath, JSON.stringify(imageData, null, 2));
        
        ctx.body = { success: true };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to activate image' };
    }
}

export async function getActiveConfig(ctx: Context) {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const activeImage = files.find(file => {
            if (!file.endsWith('.json')) return false;
            try {
                const data = JSON.parse(fs.readFileSync(path.join(IMAGES_DIR, file), 'utf8'));
                return data.active === true;
            } catch {
                return false;
            }
        });
        
        if (activeImage) {
            const data = JSON.parse(fs.readFileSync(path.join(IMAGES_DIR, activeImage), 'utf8'));
            ctx.body = data.config || {};
        } else {
            ctx.body = {};
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Failed to get active config' };
    }
}