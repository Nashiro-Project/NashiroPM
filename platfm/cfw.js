import { Telegraf } from 'telegraf'
import CacheDB from '../db/kv.js'
import nashiroPM from '../index.js'
import { Application, Router } from '@cfworker/web';
import createTelegrafMiddleware from 'cfworker-middleware-telegraf';

const conf = {
    token: TOKEN || "",
    adminid: ADMINID || 0,
    secret: SECRET
}

const bot = new Telegraf(conf.token)
nashiroPM(bot, CacheDB, conf)
const router = new Router();
router.post(`/${conf.secret}`, createTelegrafMiddleware(bot));
new Application().use(router.middleware).listen();