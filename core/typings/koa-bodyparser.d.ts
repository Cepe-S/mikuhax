// Type augmentation for koa-bodyparser
import 'koa';

declare module 'koa' {
    interface Request {
        body?: any;
        rawBody?: string;
    }
}
