import Router from "koa-router";
import { DebugController } from "../../../controller/api/v1/debug";

export const debugRouter = new Router();
const debugController = new DebugController();

debugRouter.get('/status', debugController.getDebugStatus.bind(debugController));