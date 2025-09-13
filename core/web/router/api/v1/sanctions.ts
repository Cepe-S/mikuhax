import Router from "koa-router";
import * as sanctionsController from '../../../controller/api/v1/sanctions';
import { checkLoginMiddleware } from "../../../lib/logincheck.middleware";

export const sanctionsRouter = new Router();

// Ban routes
sanctionsRouter.get('/:ruid/bans', checkLoginMiddleware, sanctionsController.getAllBans);
sanctionsRouter.post('/:ruid/bans', checkLoginMiddleware, sanctionsController.createBan);
sanctionsRouter.delete('/:ruid/bans/:auth', checkLoginMiddleware, sanctionsController.deleteBan);

// Mute routes
sanctionsRouter.get('/:ruid/mutes', checkLoginMiddleware, sanctionsController.getAllMutes);
sanctionsRouter.post('/:ruid/mutes', checkLoginMiddleware, sanctionsController.createMute);
sanctionsRouter.delete('/:ruid/mutes/:auth', checkLoginMiddleware, sanctionsController.deleteMute);