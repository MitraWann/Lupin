const simple = require('./lib/simple')
const util = require('util')

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

// ── [FIX LID/JID] resolveDbSender ────────────────────────────────────────────
async function resolveDbSender(conn, sender, users) {
    if (!sender.endsWith('@lid')) return sender

    const fromCache = conn.isLid?.get?.(sender)
    if (fromCache && !fromCache.endsWith('@lid')) return fromCache

    if (typeof conn.getJid === 'function') {
        try {
            const resolved = await conn.getJid(sender)
            if (resolved && !resolved.endsWith('@lid')) return resolved
        } catch { /* lanjut ke fallback */ }
    }

    const byStoredLid = Object.keys(users || {})
        .find(k => !k.endsWith('@lid') && users[k]?._lid === sender)
    if (byStoredLid) return byStoredLid

    console.warn(`[handler] Tidak dapat resolve LID ke JID: ${sender}`)
    return sender
}

// ── [FIX LID/JID] mergeAndCleanLidEntry ──────────────────────────────────────
function mergeAndCleanLidEntry(users, jidKey, lidKey) {
    if (jidKey === lidKey) return
    if (!users[lidKey]) return
    if (!users[jidKey]) {
        users[jidKey] = users[lidKey]
        users[jidKey]._lid = lidKey
        delete users[lidKey]
        console.log(`[handler] Pindahkan entri LID → JID: ${lidKey} → ${jidKey}`)
        return
    }

    const lid = users[lidKey]
    const jid = users[jidKey]
    const accumulativeFields = ['exp', 'command', 'commandTotal', 'chat', 'chatTotal']
    for (const field of accumulativeFields) {
        if (isNumber(lid[field]) && isNumber(jid[field])) {
            jid[field] += lid[field]
        }
    }
    jid._lid = lidKey
    delete users[lidKey]
    console.log(`[handler] Merge + hapus entri LID: ${lidKey} → ${jidKey}`)
}

module.exports = {
    async handler(chatUpdate) {
        if (global.db.data == null) await global.loadDatabase()
        this.msgqueque = this.msgqueque || []

        if (!chatUpdate) return

        // ── Raw Message Cache ─────────────────────────────────────────────────
        global.rawMessages = global.rawMessages || new Map()
        for (const raw of (chatUpdate.messages || [])) {
            global.rawMessages.set(raw.key.id, raw)
            if (global.rawMessages.size > 200) {
                const firstKey = global.rawMessages.keys().next().value
                global.rawMessages.delete(firstKey)
            }
            require('fs').writeFileSync(
                `./tmp/msg_${raw.key.id}.json`,
                JSON.stringify(raw, null, 2)
            )
        }

        if (chatUpdate.messages.length > 1) console.log(chatUpdate.messages)
        let m = chatUpdate.messages[chatUpdate.messages.length - 1]
        if (!m) return

        try {
            m = (await simple.smsg(this, m)) || m
            if (!m) return

            m.exp   = 0
            m.limit = false
            m.token = false

            // ── [FIX LID/JID] Normalisasi key DB ─────────────────────────────
            m.dbSender = await resolveDbSender(this, m.sender, global.db.data.users)

            // ── Inisialisasi DB ───────────────────────────────────────────────
            try {
                if (m.dbSender !== m.sender) {
                    mergeAndCleanLidEntry(global.db.data.users, m.dbSender, m.sender)
                }

                let user = global.db.data.users[m.dbSender]
                if (typeof user !== 'object') global.db.data.users[m.dbSender] = {}
                user = global.db.data.users[m.dbSender]

                if (user) {
                    if (!isNumber(user.saldo))       user.saldo       = 0
                    if (!isNumber(user.pengeluaran))  user.pengeluaran = 0
                    if (!isNumber(user.energi))       user.energi      = 100
                    if (!isNumber(user.title))        user.title       = 0
                    if (!isNumber(user.level))        user.level       = 0
                    if (!('location' in user))        user.location    = 'Gubuk'
                    if (!isNumber(user.exp))          user.exp         = 0
                    if (!isNumber(user.pc))           user.pc          = 0
                    if (!isNumber(user.ojek))         user.ojek        = 0
                    if (!isNumber(user.coin))         user.coin        = 0
                    if (!isNumber(user.limit))        user.limit       = 100
                    if (!isNumber(user.token))        user.token       = 10
                    if (!isNumber(user.lastkerja))    user.lastkerja   = 0
                    if (!isNumber(user.money))        user.money       = 0
                    if (!isNumber(user.poin))         user.poin        = 0
                    if (!isNumber(user.bank))         user.bank        = 0
                    if (!isNumber(user.warn))         user.warn        = 0
                    if (!('banned' in user))          user.banned      = false
                    if (!isNumber(user.bannedTime))   user.bannedTime  = 0
                    if (!isNumber(user.afk))          user.afk         = -1
                    if (!('afkReason' in user))       user.afkReason   = ''
                    if (!isNumber(user.antispam))     user.antispam    = 0
                    if (!isNumber(user.lastngojek))   user.lastngojek  = 0
                    if (!isNumber(user.lastseen))     user.lastseen    = 0
                    if (!('registered' in user))      user.registered  = false
                    if (!isNumber(user.command))      user.command      = 0
                    if (!isNumber(user.commandTotal)) user.commandTotal = 0

                    if (!user.registered) {
                        if (!('name' in user))           user.name        = await this.getName(m.sender)
                        if (!isNumber(user.skata))       user.skata       = 0
                        if (!isNumber(user.age))         user.age         = -1
                        if (!isNumber(user.regTime))     user.regTime     = -1
                        if (!isNumber(user.level))       user.level       = 0
                        if (!user.job)                   user.job         = 'Pengangguran'
                        if (!user.premium)               user.premium     = false
                        if (!user.premiumTime)           user.premiumTime = 0
                        if (!user.role)                  user.role        = 'Newbie ㋡'
                        if (!('autolevelup' in user))    user.autolevelup = true
                        if (!isNumber(user.lasttaxi))    user.lasttaxi    = 0
                        if (!isNumber(user.taxi))        user.taxi        = 0
                    }
                } else {
                    global.db.data.users[m.dbSender] = {
                        taxi: 0, lasttaxi: 0, saldo: 0, level: 0, location: 'Gubuk',
                        pc: 0, exp: 0, limit: 100, token: 10, skata: 0, lastkerja: 0,
                        money: 0, poin: 0, balance: 0, ojek: 0, banned: false,
                        bannedTime: 0, warn: 0, afk: -1, afkReason: '', antispam: 0,
                        lastngojek: 0, lastseen: 0, registered: false,
                        name: await this.getName(m.sender), age: -1, regTime: -1,
                        premium: false, premiumTime: 0, job: 'Pengangguran',
                        role: 'Newbie ㋡', autolevelup: true,
                        command: 0, commandTotal: 0,
                        ...(m.dbSender !== m.sender ? { _lid: m.sender } : {})
                    }
                }

                // ── Chat ─────────────────────────────────────────────────────
                let chat = global.db.data.chats[m.chat]
                if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
                chat = global.db.data.chats[m.chat]

                if (chat) {
                    if (!('isBanned' in chat))     chat.isBanned     = false
                    if (!('welcome' in chat))       chat.welcome      = true
                    if (!('detect' in chat))        chat.detect       = false
                    if (!('mute' in chat))          chat.mute         = false
                    if (!('listStr' in chat))       chat.listStr      = {}
                    if (!('sWelcome' in chat))      chat.sWelcome     = 'Hai, @user!\nSelamat datang di grup @subject\n\n@desc'
                    if (!('sBye' in chat))          chat.sBye         = 'Selamat tinggal @user!'
                    if (!('sPromote' in chat))      chat.sPromote     = ''
                    if (!('sDemote' in chat))       chat.sDemote      = ''
                    if (!('delete' in chat))        chat.delete       = true
                    if (!('antiLink' in chat))      chat.antiLink     = true
                    if (!('antiSticker' in chat))   chat.antiSticker  = false
                    if (!('viewonce' in chat))      chat.viewonce     = false
                    if (!('antiToxic' in chat))     chat.antiToxic    = false
                    if (!isNumber(chat.expired))    chat.expired      = 0
                    if (!('antibot' in chat))       chat.antibot      = false
                    if (!('rpg' in chat))           chat.rpg          = false
                    if (!('nsfw' in chat))          chat.nsfw         = false
                } else {
                    global.db.data.chats[m.chat] = {
                        isBanned: false, welcome: true, detect: false, mute: false,
                        listStr: {}, sWelcome: 'Hai, @user!\nSelamat datang di grup @subject\n\n@desc',
                        sBye: 'Selamat tinggal @user!', sPromote: '', sDemote: '',
                        delete: false, antiLink: false, antiSticker: false,
                        viewonce: false, antiToxic: false, antibot: false,
                        rpg: false, nsfw: false,
                    }
                }

                // ── memgc ─────────────────────────────────────────────────────
                if (m.isGroup && m.dbSender !== m.sender) {
                    const memgcObj = global.db.data.chats[m.chat]?.memgc
                    if (memgcObj && memgcObj[m.sender] && memgcObj[m.dbSender]) {
                        const lidMemgc = memgcObj[m.sender]
                        const jidMemgc = memgcObj[m.dbSender]
                        for (const f of ['chat', 'chatTotal', 'command', 'commandTotal']) {
                            if (isNumber(lidMemgc[f]) && isNumber(jidMemgc[f])) {
                                jidMemgc[f] += lidMemgc[f]
                            }
                        }
                        delete memgcObj[m.sender]
                    } else if (memgcObj && memgcObj[m.sender] && !memgcObj[m.dbSender]) {
                        memgcObj[m.dbSender] = memgcObj[m.sender]
                        delete memgcObj[m.sender]
                    }
                }

                let memgc = global.db.data.chats[m.chat]?.memgc?.[m.dbSender]
                if (typeof memgc !== 'object' || memgc === null) {
                    global.db.data.chats[m.chat]       = global.db.data.chats[m.chat] || {}
                    global.db.data.chats[m.chat].memgc = global.db.data.chats[m.chat].memgc || {}
                    global.db.data.chats[m.chat].memgc[m.dbSender] = {}
                    memgc = global.db.data.chats[m.chat].memgc[m.dbSender]
                }

                if (memgc) {
                    if (!('blacklist' in memgc))        memgc.blacklist     = false
                    if (!('banned' in memgc))           memgc.banned        = false
                    if (!isNumber(memgc.bannedTime))    memgc.bannedTime    = 0
                    if (!isNumber(memgc.chat))          memgc.chat          = 0
                    if (!isNumber(memgc.chatTotal))     memgc.chatTotal     = 0
                    if (!isNumber(memgc.command))       memgc.command       = 0
                    if (!isNumber(memgc.commandTotal))  memgc.commandTotal  = 0
                    if (!isNumber(memgc.lastseen))      memgc.lastseen      = 0
                } else {
                    global.db.data.chats[m.chat].memgc[m.dbSender] = {
                        blacklist: false, banned: false, bannedTime: 0,
                        chat: 0, chatTotal: 0, command: 0, commandTotal: 0, lastseen: 0
                    }
                }
            } catch (e) {
                console.error('Error DB Init:', e)
            }

            // ── Filter opts ───────────────────────────────────────────────────
            const opts = global.opts
            if (opts['nyimak']) return
            if (!m.fromMe && opts['self']) return
            if (opts['pconly'] && m.chat.endsWith('g.us')) return
            if (opts['gconly'] && !m.chat.endsWith('g.us')) return
            if (opts['swonly'] && m.chat !== 'status@broadcast') return
            if (typeof m.text !== 'string') m.text = ''

            // ── Message queue ─────────────────────────────────────────────────
            if (opts['queque'] && m.text) {
                this.msgqueque.push(m.id || m.key.id)
                let queueDelay = Math.min(this.msgqueque.length * 500, 5000)
                await delay(queueDelay)
                let idx = this.msgqueque.indexOf(m.id || m.key.id)
                if (idx !== -1) this.msgqueque.splice(idx, 1)
            }

            // ── Resolusi ban & owner (dipakai plugin.all, before, command) ────
            const _chatDb = global.db.data.chats[m.chat] || {}
            const _userDb = global.db.data.users[m.dbSender] || {}
            const _isOwnerAll = [this.user.jid, ...global.owner]
                .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                .includes(m.dbSender.replace(/[^0-9]/g, '') + '@s.whatsapp.net') || m.fromMe

            // ── Plugin.all ────────────────────────────────────────────────────
            for (let name in global.plugins) {
                let plugin = global.plugins[name]
                if (!plugin) continue
                if (plugin.disabled) continue
                if (!plugin.all) continue
                if (typeof plugin.all !== 'function') continue
                try {
                    // [BAN GUARD] blok semua plugin.all kecuali owner
                    if (!_isOwnerAll && (_chatDb.isBanned || _userDb.banned)) continue
                    await plugin.all.call(this, m, chatUpdate)
                } catch (e) {
                    if (typeof e === 'string') continue
                    console.error('Error Plugin All:', e)
                }
            }

            if (m.id.startsWith('3EB0') || (m.id.startsWith('BAE5') && m.id.length === 16) || (m.isBaileys && m.fromMe)) return
            m.exp += Math.ceil(Math.random() * 10)

            let usedPrefix
            let _user = global.db.data?.users?.[m.dbSender]

            // ── Resolusi Owner ────────────────────────────────────────────────
            let isROwner = [this.user.jid, ...global.owner]
                .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                .includes(m.dbSender.replace(/[^0-9]/g, '') + '@s.whatsapp.net')

            let isOwner = isROwner || m.fromMe
            let isMods  = isOwner || global.mods
                .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                .includes(m.dbSender)

            let isPrems = isROwner || (
                global.db.data.users[m.dbSender]?.premiumTime > 0 ||
                global.db.data.users[m.dbSender]?.premium
            )

            const groupMetadata = (m.isGroup
                ? (this.chats?.[m.chat] || {}).metadata ||
                  (await this.groupMetadata(m.chat).catch(() => null))
                : {}) || {}
            const participants = (m.isGroup ? groupMetadata.participants : []) || []

            const user = participants.find(u =>
                (u.jid || u.phoneNumber || u.id) === m.sender ||
                (u.jid || u.phoneNumber || u.id) === m.dbSender
            ) || {}
            const bot  = participants.find(u =>
                (u.jid || u.phoneNumber || u.id) === this.user.jid
            ) || {}

            const isRAdmin   = user?.admin === 'superadmin' || false
            const isAdmin    = isRAdmin || user?.admin === 'admin' || false
            const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin' || false

            // ── Plugin loop ───────────────────────────────────────────────────
            for (let name in global.plugins) {
                let plugin = global.plugins[name]
                if (!plugin) continue
                if (plugin.disabled) continue
                if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue

                const str2Regex   = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
                let defaultPrefix = typeof global.prefix !== 'undefined'
                    ? global.prefix
                    : /^[°•π÷×¶∆£¢€¥®™+✓_|~!?@#$%^&.©^]/i
                let _prefix = plugin.customPrefix ? plugin.customPrefix
                    : this.prefix ? this.prefix
                    : defaultPrefix

                let match = (_prefix instanceof RegExp
                    ? [[_prefix.exec(m.text), _prefix]]
                    : Array.isArray(_prefix)
                        ? _prefix.map(p => {
                            let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                            return [re.exec(m.text), re]
                          })
                        : typeof _prefix === 'string'
                            ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
                            : [[[], new RegExp]]
                ).find(p => p[1])

                // [BAN GUARD] plugin.before TANPA prefix (guard plugin seperti _banchat-guard, _AI-tag, dll)
                // Harus dicek SEBELUM `if (!match) continue` agar tidak lolos
                if (typeof plugin.before === 'function' && !match) {
                    if (!_isOwnerAll && (_chatDb.isBanned || _userDb.banned)) continue
                    if (await plugin.before.call(this, m, {
                        match, conn: this, participants, groupMetadata,
                        user, bot, isROwner, isOwner, isAdmin, isBotAdmin, isPrems, chatUpdate,
                    })) continue
                }

                if (!match) continue

                // [BAN GUARD] plugin.before DENGAN prefix
                if (typeof plugin.before === 'function') {
                    if (!_isOwnerAll && (_chatDb.isBanned || _userDb.banned)) continue
                    if (await plugin.before.call(this, m, {
                        match, conn: this, participants, groupMetadata,
                        user, bot, isROwner, isOwner, isAdmin, isBotAdmin, isPrems, chatUpdate,
                    })) continue
                }

                if (typeof plugin !== 'function') continue

                if ((usedPrefix = (match[0] || '')[0])) {
                    let noPrefix = m.text.replace(usedPrefix, '')
                    let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                    args = args || []
                    let _args   = noPrefix.trim().split` `.slice(1)
                    let text    = _args.join` `
                    command     = (command || '').toLowerCase()
                    let fail    = plugin.fail || global.dfail

                    let isAccept = plugin.command instanceof RegExp
                        ? plugin.command.test(command)
                        : Array.isArray(plugin.command)
                            ? plugin.command.some(cmd =>
                                cmd instanceof RegExp ? cmd.test(command) : cmd === command)
                            : typeof plugin.command === 'string'
                                ? plugin.command === command
                                : false

                    if (!isAccept) continue
                    m.plugin = name

                    if (m.chat in global.db.data.chats || m.dbSender in global.db.data.users) {
                        let chatDb = global.db.data.chats[m.chat]
                        let userDb = global.db.data.users[m.dbSender]

                        // [BAN GUARD] command loop — owner bypass semua ban
                        const bypassList = ['group-modebot.js', 'owner-unbanchat.js', 'owner-exec.js', 'owner-exec2.js', 'tool-delete.js']
                        if (!isOwner && !bypassList.includes(name) && (chatDb?.isBanned || chatDb?.mute)) continue
                        if (!isOwner && name !== 'owner-unbanuser.js' && userDb && userDb.banned) continue

                        if (m.isGroup && chatDb?.memgc?.[m.dbSender]) {
                            chatDb.memgc[m.dbSender].command++
                            chatDb.memgc[m.dbSender].commandTotal++
                            chatDb.memgc[m.dbSender].lastCmd = Date.now()
                        }

                        if (userDb) {
                            userDb.command++
                            userDb.commandTotal++
                            userDb.lastCmd = Date.now()
                        }
                    }

                    // ── Permission checks ──────────────────────────────────────
                    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                        fail('owner', m, this); continue
                    }
                    if (plugin.rowner && !isROwner) {
                        fail('rowner', m, this); continue
                    }
                    if (plugin.owner && !isOwner) {
                        fail('owner', m, this); continue
                    }
                    if (plugin.mods && !isMods) {
                        fail('mods', m, this); continue
                    }
                    if (plugin.premium && !isPrems) {
                        fail('premium', m, this); continue
                    }
                    if (plugin.group && !m.isGroup) {
                        fail('group', m, this); continue
                    }
                    if (plugin.botAdmin && !isBotAdmin) {
                        fail('botAdmin', m, this); continue
                    }
                    if (plugin.admin && !isAdmin) {
                        fail('admin', m, this); continue
                    }
                    if (plugin.private && m.isGroup) {
                        fail('private', m, this); continue
                    }
                    if (plugin.register === true && _user?.registered === false) {
                        fail('unreg', m, this); continue
                    }
                    if (plugin.rpg && !global.db.data.chats[m.chat]?.rpg) {
                        fail('rpg', m, this); continue
                    }
                    if (plugin.nsfw && !global.db.data.chats[m.chat]?.nsfw) {
                        fail('nsfw', m, this); continue
                    }

                    m.isCommand = true
                    let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
                    if (xp > 200) m.reply('Ngecit -_-')
                    else m.exp += xp

                    if (!isPrems && plugin.limit && global.db.data.users[m.dbSender]?.limit < plugin.limit * 1) {
                        this.reply(m.chat, `Limit anda habis, silahkan beli melalui *${usedPrefix}buy* atau beli di *${usedPrefix}shop*`, m)
                        continue
                    }

                    if (!isOwner && plugin.token && global.db.data.users[m.dbSender]?.token < plugin.token * 1) {
                        fail('token', m, this); continue
                    }

                    if (plugin.level > _user?.level) {
                        this.reply(m.chat, `Diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${_user?.level || 0}\nGunakan .levelup untuk menaikkan level!`, m)
                        continue
                    }

                    let extra = {
                        match, usedPrefix, noPrefix, _args, args, command, text,
                        conn: this, participants, groupMetadata,
                        user, bot, isROwner, isOwner, isAdmin, isBotAdmin, isPrems, chatUpdate,
                    }

                    try {
                        await plugin.call(this, m, extra)
                        if (!isPrems) m.limit = m.limit || plugin.limit || false
                        if (!isOwner) m.token = m.token || plugin.token || false
                    } catch (e) {
                        m.error = e
                        console.error(e)
                        if (e) {
                            let errText = util.format(e)
                            if (typeof global.APIKeys !== 'undefined') {
                                for (let key of Object.values(global.APIKeys))
                                    errText = errText.replace(new RegExp(key, 'g'), '#HIDDEN#')
                            }
                            if (e.name) {
                                let owners = global.owner || []
                                for (let jid of owners
                                    .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                                    .filter(v => v !== this.user.jid)
                                ) {
                                    let data = (await this.onWhatsApp(jid))[0] || {}
                                    if (data.exists)
                                        console.error(`Error on Plugin:${m.plugin} | Error: ${errText}`)
                                }
                            }
                            m.reply(errText)
                        }
                    } finally {
                        if (typeof plugin.after === 'function') {
                            try {
                                await plugin.after.call(this, m, extra)
                            } catch (e) {
                                console.error(e)
                            }
                        }
                        if (m.limit) m.reply(+m.limit + ' Limit terpakai')
                        if (m.token) m.reply(+m.token + ' Token terpakai')
                    }
                    break
                }
            }
        } catch (e) {
            console.error('Fatal Handler Error:', e)
        } finally {
            const opts = global.opts
            let user, stats = global.db.data.stats
            if (m) {
                const key = m.dbSender || m.sender
                if (key && (user = global.db.data.users[key])) {
                    user.exp   += m.exp
                    user.limit -= m.limit * 1
                    user.token -= m.token * 1
                }
            }
            try {
                require('./lib/print')(m, this)
            } catch (e) {
                // silent
            }
            if (opts['autoread']) await this.readMessages([m.key]).catch(() => {})
        }
    },

        async participantsUpdate({ id, participants, action }) {
        try {
            const opts = global.opts || {}

            // 1. Mode self → diam total
            if (opts['self']) {
                console.log('[WELCOME] BOT SELF MODE — tidak kirim welcome/bye')
                return
            }

            if (global.isInit) return

            const chat = global.db.data?.chats?.[id] || {}

            // 2. Grup di-ban atau mute → diam
            if (chat.isBanned || chat.mute) {
                console.log(`[WELCOME] Grup ${id} isBanned=${chat.isBanned} mute=${chat.mute} — skip`)
                return
            }

            // 3. Welcome dimatikan → diam
            if (!chat.welcome) {
                console.log(`[WELCOME] welcome=false untuk ${id}`)
                return
            }

            // Hanya proses aksi yang relevan
            const validActions = ['add', 'remove', 'leave', 'invite', 'invite_v4']
            if (!validActions.includes(action)) return

            const groupMetadata = await this.groupMetadata(id).catch(() => null)
            if (!groupMetadata) return

            const isAdd = ['add', 'invite', 'invite_v4'].includes(action)

            for (let user of participants) {
                let jid = typeof user === 'object' ? (user.phoneNumber || user.id || user.jid || user) : user
                if (!jid || (!jid.includes('@s.whatsapp.net') && !jid.includes('@lid'))) continue

                // 4. User yang dibanned tidak disambut
                const userDb = global.db.data.users?.[jid]
                if (userDb?.banned) {
                    console.log(`[WELCOME] User ${jid} banned — skip`)
                    continue
                }

                let pp = 'https://telegra.ph/file/70e8de9b1879568954f09.jpg'
                try { pp = await this.profilePictureUrl(jid, 'image') } catch {}

                const fallbackWelcome = this.welcome || 'Welcome, @user!'
                const fallbackBye     = this.bye     || 'Bye, @user!'

                let text = (isAdd
                    ? (chat.sWelcome || fallbackWelcome)
                    : (chat.sBye     || fallbackBye))
                    .replace('@subject', groupMetadata.subject || 'this group')
                    .replace('@desc',    groupMetadata.desc?.toString() || '')
                    .replace('@user',    '@' + jid.replace(/@.+/, ''))

                await this.sendMessage(id, {
                    text,
                    mentions: [jid],
                    contextInfo: { mentionedJid: [jid] }
                }).catch(e => console.error('[WELCOME] Gagal kirim:', e))
            }
        } catch (err) {
            console.error('Error participantsUpdate:', err)
        }
    },

    async delete({ remoteJid, fromMe, id, participant }) {
        try {
            if (fromMe) return
            if (!this.chats) return

            let chats = Object.entries(this.chats).find(([, data]) => data.messages && data.messages[id])
            if (!chats) return

            let msg = chats[1].messages[id]
            if (typeof msg === 'string') {
                try { msg = JSON.parse(msg) } catch { return }
            }
            if (!msg) return

            let chat = global.db.data.chats[msg.key.remoteJid] || {}
            // [BAN GUARD] jangan kirim anti-delete di grup banned
            if (chat.isBanned) return
            if (chat.delete) return

            let participantId = participant || msg.key.participant || msg.key.remoteJid
            let tag = participantId ? `@${participantId.replace(/@.+/, '')}` : '@unknown'

            await this.sendMessage(msg.key.remoteJid, {
                text: `Terdeteksi ${tag} telah menghapus pesan\nUntuk mematikan fitur ini, ketik\n*.enable delete*`,
                mentions: participantId ? [participantId] : [],
                contextInfo: { mentionedJid: participantId ? [participantId] : [] }
            }, { quoted: msg }).catch(() => {})

            this.copyNForward(msg.key.remoteJid, msg)
                .catch(e => console.log('Gagal copyNForward anti-delete:', e))
        } catch (err) {
            console.error('Error in anti-delete:', err)
        }
    }
}

// ── Global dfail ──────────────────────────────────────────────────────────────
global.dfail = (type, m, conn) => {
    let msg = {
        rowner:  'Perintah ini hanya dapat digunakan oleh _*OWNER!1!1!*_',
        owner:   'Perintah ini hanya dapat digunakan oleh _*Owner Bot*_!',
        mods:    'Perintah ini hanya dapat digunakan oleh _*Owner dan Moderator*_ !',
        rpg:     'Fitur RPG Dimatikan Oleh Admin\n\n> ketik *.enable rpg* agar dapat akses fitur rpg',
        nsfw:    'Fitur NSFW Dimatikan Oleh Admin\n\n> ketik *.enable nsfw* agar dapat akses fitur NSFW',
        premium: 'Perintah ini hanya untuk member _*Premium*_ !',
        group:   'Perintah ini hanya dapat digunakan di grup! \n> Ketik .gcbot untuk bergabung ke grup official bot.',
        private: 'Perintah ini hanya dapat digunakan di Chat Pribadi!',
        admin:   'Perintah ini hanya untuk *Admin* grup!',
        botAdmin:'Jadikan bot sebagai *Admin* untuk menggunakan perintah ini!',
        unreg:   'Silahkan daftar untuk menggunakan fitur ini dengan cara mengetik:\n\n*#daftar nama.umur*\n\nContoh: *#daftar Mitra.16*',
        restrict:'Fitur ini di *disable*!',
        token:   'Token anda habis! Fitur ini memerlukan token khusus.'
    }[type]
    if (msg) return m.reply(msg)
}

// ── Hot-reload watcher ────────────────────────────────────────────────────────
let fs    = require('fs')
let chalk = require('chalk')
let file  = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    delete require.cache[file]
    if (global.reloadHandler) console.log(global.reloadHandler())
})