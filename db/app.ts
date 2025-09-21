import "reflect-metadata";

// ========================================================
// Haxbotron Headless Host Server for Haxball by dapucita
// https://github.com/dapucita/haxbotron
// ========================================================
import "dotenv/config";
import * as path from "path";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import ip from "koa-ip";
import logger from "koa-logger";
import { createConnection } from "typeorm";
import { winstonLogger } from "./utility/winstonLoggerSystem";
import { Player } from "./entity/player.entity";
import { BanList } from "./entity/banlist.entity";
import { SuperAdmin } from "./entity/superadmin.entity";
import { MatchEvent } from "./entity/match_event.entity";
import { MatchSummary } from "./entity/match_summary.entity";
import { Connection } from "./entity/connection.entity";
import { MuteList } from "./entity/mutelist.entity";
import { apiRouterV1 } from "./router/v1.api.router";
import { simpleRouter } from "./router/simple.router";
// ========================================================
//const _GitHublastestRelease = await axios.get('https://api.github.com/repos/dapucita/haxbotron/releases/latest');
console.log("_|    _|                      _|                    _|                                  " + "\n" +
    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|    _|_|_|_|  _|  _|_|    _|_|    _|_|_|  " + "\n" +
    "_|_|_|_|  _|    _|    _|_|    _|    _|  _|    _|    _|      _|_|      _|    _|  _|    _|" + "\n" +
    "_|    _|  _|    _|  _|    _|  _|    _|  _|    _|    _|      _|        _|    _|  _|    _|" + "\n" +
    "_|    _|    _|_|_|  _|    _|  _|_|_|      _|_|        _|_|  _|          _|_|    _|    _|");
//console.log(`Lastest Version : ${_GitHublastestRelease.data.tag_name} | Current Version : v${process.env.npm_package_version}`);
console.log(`Haxbotron by dapucita (Visit our GitHub : https://github.com/dapucita/haxbotron)`);
winstonLogger.info(`haxbotron-db server is launched at ${new Date().toLocaleString()}`);
// ========================================================
const dbServerSettings = {
    port: (process.env.SERVER_PORT ? parseInt(JSON.parse(process.env.SERVER_PORT)) : 13001)
    , level: (process.env.SERVER_LEVEL || 'common')
}
const whiteListIPs: string[] = process.env.SERVER_WHITELIST_IP?.split(",") || [];
// ========================================================
// DB CONNECTION
createConnection({
    type: 'sqlite',
    database: path.join(__dirname, '..', process.env.DB_HOST || 'haxbotron.sqlite.db'),
    entities: [Player, BanList, SuperAdmin, MatchEvent, MatchSummary, Connection, MuteList],
    logging: false, // Disable logging for better performance
    synchronize: true,
    dropSchema: false,
    cache: {
        type: 'database',
        duration: 30000 // Cache queries for 30 seconds
    },
    extra: {
        // SQLite optimizations
        "journal_mode": "WAL",
        "synchronous": "NORMAL",
        "cache_size": -64000, // 64MB cache
        "temp_store": "MEMORY"
    }
}).then(async conn => {
    winstonLogger.info('[db] Database connection established');
    winstonLogger.info('[db] TypeORM synchronization enabled');
    
    const app = new Koa(); // koa server
    const router = new Router();

    router.use('/api/v1', apiRouterV1.routes());
    router.use('/api/v1', simpleRouter.routes());

    app
        .use(ip(whiteListIPs))
        .use(logger())
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());

    // LISTENING
    app.listen(dbServerSettings.port, '0.0.0.0', () => {
        winstonLogger.info(`[db] Haxbotron DB server is opened at ${dbServerSettings.port} port.`);
        winstonLogger.info(`[db] IP Whitelist : ${whiteListIPs}`);
    });
}).catch(err => {
    winstonLogger.error(`[db] Failed to start server. Error: ${err}`);
});
