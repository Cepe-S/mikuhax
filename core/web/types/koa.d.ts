import 'koa';
import 'koa-bodyparser';

declare module 'koa' {
    interface Request {
        body?: any;
    }
}
