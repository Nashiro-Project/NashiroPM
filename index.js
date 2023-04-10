import { Telegraf } from 'telegraf'
import CacheDB from './db/local.js'
import conf from './config.js'
const bot = new Telegraf(conf.token)
const config = new CacheDB('config')
const userdata = new CacheDB('userdata')
userdata.init()
config.ini
bot.command('init', async(ctx) => {
    ctx.reply('已设置，群组id:' + ctx.chat.id)
    await config.set('groupid', ctx.chat.id)
    await config.set("mode", "forward")
    await config.set("uuid",(Math.random()*100000000000000000).toString(16))
})

bot.on('message', async (ctx) => {
    const groupid = await config.get('groupid')
    const userflect = await userdata.get('userflect') || {}
    const tgconsole=(content)=>{
        ctx.telegram.sendMessage(groupid,content)
    }
    if (ctx.message.from.is_bot) {
        return
    }
    if (ctx.chat.type == 'private') {
        if (!userflect[ctx.message.from.id]) {
            tgconsole('新pm用户'+ctx.message.from.id)
            ctx.telegram.createForumTopic(
                groupid,
                ctx.from.first_name || "" + " " + ctx.from.last_name || "",
            ).then(async (res) => {
                userflect[ctx.message.from.id] = {
                    message_thread_id: res.message_thread_id
                }
                await userdata.set('userflect', userflect)
                ctx.telegram.forwardMessage(groupid, ctx.chat.id, ctx.message.message_id,
                    {
                        message_thread_id: res.message_thread_id
                    }
                )
                //在对应话题中发生用户基本信息，如头像、名字等等
                ctx.telegram.sendMessage(groupid, '用户信息：'+"\n"+
                'id:'+ctx.message.from.id+"\n"+
                'first_name:'+ctx.message.from.first_name+"\n"+
                'last_name:'+ctx.message.from.last_name+"\n"+
                'username:'+ctx.message.from.username+"\n"+
                "userlink:"+`https://t.me/${ctx.message.from.username}`+"\n"
                , {
                    message_thread_id: res.message_thread_id
                })
            })
        }
        else {
            ctx.telegram.forwardMessage(groupid, ctx.chat.id, ctx.message.message_id,
                {
                    message_thread_id: userflect[ctx.message.from.id].message_thread_id
                }
            )
        }
    } else {
        if (ctx.chat.id == groupid) {
            const uid = ctx.message.message_thread_id
            if (uid) {
                const realchatid = Object.keys(userflect).find((key) => {
                    return userflect[key].message_thread_id == uid
                })
                if (!realchatid) {
                    ctx.telegram.sendMessage(groupid, '无法找到用户'+uid)
                }
                switch (await config.get("mode")) {
                    case 'forward':
                        ctx.telegram.forwardMessage(
                            realchatid,
                            groupid,
                            ctx.message.message_id
                        )
                        break
                    case 'markdown':
                        ctx.telegram.sendMessage(
                            realchatid,
                            ctx.message.text,
                            {
                                parse_mode: 'Markdown'
                            }
                        )
                        break
                    case 'text':
                        ctx.telegram.sendMessage(
                            realchatid,
                            ctx.message.text
                        )
                        break
                    default:
                        tgconsole('Unknown Mode')
                        break

                }

            } else {
                const msg = ctx.message.text
                if(msg[0]!=="/"){
                    tgconsole('Command Invalid')
                }
                switch (ctx.message.text.split(' ')[0]) {
                    case '/mode':
                        const mode = ctx.message.text.split(' ')[1]
                        if (mode == 'forward' || mode == 'markdown' || mode == 'text') {
                            config.set("mode", mode)
                            tgconsole('已切换到'+mode+'模式')
                        }
                        else {
                            tgconsole('模式错误')
                        }
                        break
                    default:
                        tgconsole('Unknown command')
                        break
            }
        }
        }
        else {
            ctx.reply('请在私聊中使用喵！')
        }
    }


}
)







bot.launch()