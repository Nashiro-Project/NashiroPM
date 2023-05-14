import ReadableTime from './time.js'
let handlelock = false
function nashiroPM(bot, CacheDB, conf) {
    const config = new CacheDB('config')
    const userdata = new CacheDB('userdata')
    userdata.init()
    config.init()
    bot.command('init', async (ctx) => {
        if (ctx.message.from.id != conf.adminid) {
            ctx.reply('你不是管理员咪！无权init咪！')
            return
        }
        if (!ctx.chat.is_forum) {
            ctx.reply('请在已开启Topic群组中使用init喵！')
            return
        }
        await config.set('groupid', ctx.chat.id)
        await config.set("mode", "forward")
        await config.set("uuid", (Math.random() * 100000000000000000).toString(16))
        //welcome
        await config.set("welcome", "ww!这是利用nashiroPM项目创建的私聊机器人喵！你可以直接与此机器人对话，它会将你的消息转发到主人手中喵！")
        ctx.reply('已设置，群组id:' + ctx.chat.id)
        ctx.telegram.editGeneralForumTopic(ctx.chat.id, "PMbot 控制台"+(await config.get("uuid"))).then(async (res) => {
            ctx.telegram.editGeneralForumTopic(ctx.chat.id, "PMbot 控制台")
        })
        ctx.telegram.sendMessage(ctx.chat.id, '如果需要帮助，请使用/help')
    })
    bot.command('start', async (ctx) => {
        const config = new CacheDB('config')
        const welcome = await config.get("welcome")
        ctx.reply(welcome)
    })
    bot.on('message', async (ctx) => {
        const tgconsole = (content) => {
            ctx.telegram.sendMessage(groupid, content)
        }
        if (ctx.message.from.is_bot) {
            return
        }
        while (handlelock) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve()
                }, 1000)
            })
        }
        handlelock = true
        const groupid = await config.get('groupid')
        const userflect = await userdata.get('userflect') || {}

        if (ctx.chat.type == 'private') {

            if (!userflect[ctx.message.from.id]) {
                tgconsole('新pm用户' + ctx.message.from.id)
                ctx.telegram.createForumTopic(
                    groupid,
                    ctx.from.first_name || "" + " " + ctx.from.last_name || "",
                ).then(async (res) => {
                    userflect[ctx.message.from.id] = {
                        nickname: ctx.from.first_name || "" + " " + ctx.from.last_name || "",
                        message_thread_id: res.message_thread_id,
                        historyreflect: [],
                        //0 in forum
                        //1 in pm
                        created_at: Date.now(),
                        lastchat_at: Date.now(),
                        block: false,
                        ban: false,
                        unblock_time: 0

                    }
                    await userdata.set('userflect', userflect)
                    //在对应话题中发生用户基本信息，如头像、名字等等
                    ctx.telegram.sendMessage(groupid, '用户信息：' + "\n" +
                        'id:' + ctx.message.from.id + "\n" +
                        'first_name:' + ctx.message.from.first_name + "\n" +
                        'last_name:' + ctx.message.from.last_name + "\n" +
                        'username:' + ctx.message.from.username + "\n" +
                        "userlink:" + `https://t.me/${ctx.message.from.username}` + "\n"
                        , {
                            message_thread_id: res.message_thread_id
                        })
                    ctx.telegram.forwardMessage(groupid, ctx.chat.id, ctx.message.message_id,
                        {
                            message_thread_id: res.message_thread_id
                        }
                    ).then(async (res) => {
                        userflect[ctx.message.from.id].historyreflect.push([ctx.message.message_id, res.message_id])
                        userflect[ctx.message.from.id].lastchat_at = Date.now()
                        await userdata.set('userflect', userflect)
                    })

                })
            }
            else {
                handlelock = false
                if (userflect[ctx.message.from.id].ban) {
                    return
                }
                if (userflect[ctx.message.from.id].block) {
                    if (userflect[ctx.message.from.id].unblock_time < Date.now()) {
                        userflect[ctx.message.from.id].block = false
                        await userdata.set('userflect', userflect)
                        tgconsole('已解除屏蔽用户' + ctx.message.from.id)
                        ctx.telegram.openForumTopic(groupid, userflect[ctx.message.from.id].message_thread_id)
                    }
                    if (await config.get("blocknotice")) {
                        ctx.reply('*消息已发出，但被对方拒收了。屏蔽将在' + ReadableTime(userflect[ctx.message.from.id].unblock_time - Date.now()) + '后解除*', {
                            parse_mode: 'MarkdownV2'
                        })
                    }
                    return
                }
                ctx.telegram.forwardMessage(groupid, ctx.chat.id, ctx.message.message_id,
                    {
                        message_thread_id: userflect[ctx.message.from.id].message_thread_id
                    }
                ).then(async (res) => {
                    userflect[ctx.message.from.id].historyreflect.push([ctx.message.message_id, res.message_id])
                    userflect[ctx.message.from.id].lastchat_at = Date.now()
                    await userdata.set('userflect', userflect)
                })
            }
        } else {
            if (ctx.chat.id == groupid) {
                handlelock = false
                const uid = ctx.message.message_thread_id
                if (uid) {
                    const realchatid = Object.keys(userflect).find((key) => {
                        return userflect[key].message_thread_id == uid
                    })
                    if (!realchatid) {
                        tgconsole('未找到对应用户')
                        return
                    }
                    const msg = ctx.message.text || "  "
                    if (msg[0] === "/") {
                        switch (ctx.message.text.split(' ')[0].split('@')[0]) {
                            case '/block':
                                const block_time = eval(ctx.message.text.split(' ')[1] || 1000 * 60 * 60 * 24)

                                userflect[realchatid].block = true
                                userflect[realchatid].unblock_time = Date.now() + block_time
                                await userdata.set('userflect', userflect)
                                tgconsole('已屏蔽用户' + realchatid + "，屏蔽时间：" + ReadableTime(block_time))
                                ctx.telegram.closeForumTopic(groupid, uid)
                                ctx.reply("已屏蔽，若要再次解除屏蔽请使用/unblock")
                                break
                            case '/unblock':
                                userflect[realchatid].block = false
                                await userdata.set('userflect', userflect)
                                tgconsole('已解除屏蔽用户' + realchatid)
                                ctx.telegram.reopenForumTopic(groupid, uid)
                                ctx.reply("已解除屏蔽，若要再次屏蔽请使用/block")
                                break

                            case '/ban':
                                userflect[realchatid].ban = true
                                await userdata.set('userflect', userflect)
                                tgconsole('已永久封禁用户' + realchatid)
                                ctx.telegram.deleteForumTopic(groupid, uid)
                                return
                            case '/clear':
                                const mlength = userflect[realchatid].historyreflect.length
                                tgconsole('正在清除用户记录' + realchatid + "\n" +
                                    "共" + mlength + "条记录" + "\n" +
                                    "为了避免被tg限制，速率限制每秒删除5条记录")
                                ctx.telegram.deleteForumTopic(groupid, uid)

                                await new Promise((resolve) => {
                                    let i = 0
                                    const interval = setInterval(() => {
                                        if (i >= userflect[realchatid].historyreflect.length) {
                                            clearInterval(interval)
                                            resolve()
                                            return
                                        }
                                        ctx.telegram.deleteMessage(realchatid, userflect[realchatid].historyreflect[i][0])
                                        i++
                                    }, 200)
                                })

                                delete userflect[realchatid]
                                await userdata.set('userflect', userflect)

                                tgconsole('已双向清除用户记录' + realchatid)
                                break
                            case '/help':
                                ctx.reply('这些命令适用于与用户对话中：\n' +
                                    '/block [time] 屏蔽用户，time为屏蔽时间，单位为ms，不填则默认为24h。可填入js表达式，如1000*60*60*24*7为7天\n' +
                                    '/unblock 解除屏蔽\n' +
                                    '/ban 永久封禁用户，*注意，你将无法再次与此用户对话，除非你清除数据库内容*\n' +
                                    '/clear 清除用户记录，*注意这也会将此用户所有聊天记录和用户状态（如封禁状态）一并清除*\n' +
                                    '/help 查看帮助\n'
                                    , {
                                        parse_mode: 'MarkdownV2'
                                    })


                            default:
                                tgconsole('Unknown command')
                                break

                        }
                        return
                    }
                    if (userflect[realchatid].block) {
                        ctx.reply('*NOTES:此用户已被你屏蔽，你无法给他发送消息*', {
                            parse_mode: 'MarkdownV2'
                        })
                        return
                    }
                    switch (await config.get("mode")) {
                        case 'forward':
                            ctx.telegram.forwardMessage(
                                realchatid,
                                groupid,
                                ctx.message.message_id
                            ).then(async (res) => {
                                userflect[realchatid].historyreflect.push([res.message_id, ctx.message.message_id])
                                userflect[realchatid].lastchat_at = Date.now()
                                await userdata.set('userflect', userflect)
                            })
                            break
                        case 'MarkdownV2':
                            ctx.telegram.sendMessage(
                                realchatid,
                                ctx.message.text,
                                {
                                    parse_mode: 'MarkdownV2'
                                }
                            ).then(async (res) => {
                                userflect[realchatid].historyreflect.push([res.message_id, ctx.message.message_id])
                                userflect[realchatid].lastchat_at = Date.now()
                                await userdata.set('userflect', userflect)
                            })
                            break
                        case 'text':
                            ctx.telegram.sendMessage(
                                realchatid,
                                ctx.message.text
                            ).then(async (res) => {
                                userflect[realchatid].historyreflect.push([res.message_id, ctx.message.message_id])
                                userflect[realchatid].lastchat_at = Date.now()
                                await userdata.set('userflect', userflect)
                            })
                            break
                        default:
                            tgconsole('Unknown Mode')
                            break

                    }


                } else {
                    const msg = ctx.message.text || " "
                    if (msg[0] !== "/") {
                        tgconsole('Command Invalid')
                        return
                    }
                    switch (ctx.message.text.split(' ')[0].split('@')[0]) {
                        
                        case '/mode':
                            const mode = ctx.message.text.split(' ')[1]
                            if (mode == 'forward' || mode == 'MarkdownV2' || mode == 'text') {
                                config.set("mode", mode)
                                tgconsole('已切换到' + mode + '模式')
                            }
                            else {
                                tgconsole('模式错误')
                            }
                            break
                        case '/welcome':
                            const welcome = ctx.message.text.replace('/welcome', '')
                            if (welcome == ' ') {
                                tgconsole('请输入welcome内容，不得为空')
                                return
                            }
                            await config.set("welcome", welcome)
                            tgconsole('已设置welcome')
                            break
                        case '/delall':
                            for (let key in userflect) {
                                ctx.telegram.deleteForumTopic(groupid, userflect[key].message_thread_id)
                            }
                            await userdata.set('userflect', {})
                            tgconsole('已清空所有用户')
                            break
                        case "/blocknotice":
                            await config.set("blocknotice", !await config.get("blocknotice"))
                            tgconsole("已切换blocknotice，目前被屏蔽用户将" + (await config.get("blocknotice") ? "" : "不") + "会收到通知")
                            break
                        case "/help":
                            tgconsole('这些命令适用于控制台中：\n' +
                                '/mode [forward|MarkdownV2|text] 切换转发模式\n' +
                                '/welcome [welcome] 设置欢迎语\n' +
                                '/delall 清空所有用户，注意这也会将所有聊天记录和用户状态一并清除\n' +
                                '/blocknotice 切换屏蔽通知\n' +
                                '/help 查看帮助\n'
                                , {
                                    parse_mode: 'markdownV2'
                                })
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
        handlelock = false

    }
    )







    bot.launch()
}
export default nashiroPM