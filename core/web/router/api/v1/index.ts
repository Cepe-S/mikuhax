import Router from "koa-router";
import cors from "@koa/cors";
import { authRouter } from "./auth";
import { roomRouter } from "./room";
import { initRouter } from "./init";
import { systemRouter } from "./system";
import { superadminRouter } from "./superadmin";
import { ruidlistRouter } from "./ruidlist";
import { banlistRouter } from "./banlist";
import { playerlistRouter } from "./playerlist";
import { sanctionsRouter } from "./sanctions";
import { serverImageRouter } from "../../v1.serverimage.router";


export const indexAPIRouter = new Router();

indexAPIRouter
    .use(cors({
            origin: process.env.CLIENT_HOST,
            credentials: true,
        }))
    .use('/room', roomRouter.routes())
    .use('/auth', authRouter.routes())
    .use('/init', initRouter.routes())
    .use('/superadmin', superadminRouter.routes())
    .use('/ruidlist', ruidlistRouter.routes())
    .use('/banlist', banlistRouter.routes())
    .use('/playerlist', playerlistRouter.routes())
    .use('/sanctions', sanctionsRouter.routes())
    .use('/system', systemRouter.routes())
    .use('/images', serverImageRouter.routes())

