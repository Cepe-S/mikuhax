import Router from "koa-router";
import { BalanceController } from "../../../controller/api/v1/balance";

export const balanceRouter = new Router();
const balanceController = new BalanceController();

balanceRouter.get('/status', balanceController.getBalanceStatus.bind(balanceController));