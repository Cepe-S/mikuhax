import Router from "koa-router";
import { sanctionsRouter } from "./sanctions";

// Legacy banlist router - redirects to sanctions
export const banlistRouter = new Router();

// Redirect old banlist routes to new sanctions routes
banlistRouter.use(sanctionsRouter.routes());