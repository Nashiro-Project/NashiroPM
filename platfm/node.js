import { Telegraf } from 'telegraf'
import CacheDB from '../db/local.js'
import nashiroPM from '../index.js' 
import conf from '../config.js'
const bot = new Telegraf(conf.token)
nashiroPM(bot, CacheDB, conf)