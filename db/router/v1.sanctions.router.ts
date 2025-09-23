import Router from "koa-router";
import { SanctionsController } from "../controller/sanctions.controller";

const sanctionsController = new SanctionsController();
export const sanctionsRouter = new Router();

sanctionsRouter
    .post('/sanctions', sanctionsController.createSanction.bind(sanctionsController))
    .get('/sanctions/check', sanctionsController.checkSanction.bind(sanctionsController))
    .delete('/sanctions/:type/:auth', sanctionsController.deleteSanction.bind(sanctionsController))
    .get('/sanctions', sanctionsController.getSanctions.bind(sanctionsController))
    .get('/bans', sanctionsController.getBans.bind(sanctionsController));