// Koa Request body type augmentation
// This ensures ctx.request.body is properly typed across all environments

import * as Koa from 'koa';

declare module 'koa' {
    interface Request {
        body?: any;
        rawBody?: string;
    }
}
