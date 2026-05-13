let didyoumean = require('didyoumean')
let similarity = require('similarity')

let handler = m => m

handler.before = function (m, { conn, match, isOwner }) {
    let setting = global.db.data.settings[conn.user.jid] || {}
    if (setting.modeSelfCustom && !m.fromMe && !isOwner) return

    let txt = (m.text || '').toLowerCase().trim();

    conn.didyoumean = conn.didyoumean || {};

    if (txt === 'y' || txt === 'ya') {
        let session = conn.didyoumean[m.sender];
        if (session) {
            if (Date.now() - session.time < 30000) {
                let isROwner = [conn.user.jid, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
                let isPrems = isROwner || (global.db.data.users[m.sender]?.premiumTime > 0 || global.db.data.users[m.sender]?.premium);

                if (isPrems) {
                    m.text = session.mean; 
                    conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
                }
            }
            delete conn.didyoumean[m.sender];
        }
    }

    let text = m.text || '';
    
    let isPrefixSymbol = /^[.,!#%&\\-_+|~?]/;

    if (!isPrefixSymbol.test(text)) return;

    let usedPrefix = text.charAt(0);
    let commandOnly = text.slice(1).trim().split(' ')[0].toLowerCase();
    
    if (!commandOnly) return;
    if (/^[>=!<]+$/.test(commandOnly)) return;

    let validAliases = []
    let helpList = [] 

    for (let name in global.plugins) {
        let plugin = global.plugins[name]
        if (!plugin || plugin.disabled) continue

        if (plugin.help) {
            let helps = Array.isArray(plugin.help) ? plugin.help : [plugin.help]
            helps.forEach(h => {
                let cleanHelp = h.split(' ')[0].toLowerCase()
                validAliases.push(cleanHelp)
                helpList.push(cleanHelp)
            })
        }

        if (plugin.command) {
            let cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
            cmds.forEach(c => {
                if (typeof c === 'string') {
                    validAliases.push(c.toLowerCase())
                } else if (c instanceof RegExp) {
                    let str = c.toString()
                    str = str.replace(/^\/\^?\(/, '').replace(/^\/\^?/, '')
                    str = str.replace(/\)\$?\/[a-z]*$/i, '').replace(/\$?\/[a-z]*$/i, '')
                    
                    let parts = str.split('|')
                    parts.forEach(p => {
                        let clean = p.replace(/\\/g, '').trim().toLowerCase()
                        if (clean && !clean.includes('*') && !clean.includes('?')) {
                            validAliases.push(clean)
                        }
                    })
                }
            })
        }
    }

    if (validAliases.includes(commandOnly)) return

    helpList = [...new Set(helpList)]

    let mean = didyoumean(commandOnly, helpList)
    let sim = mean ? similarity(commandOnly, mean) : 0
    let som = sim * 100

    let tag = `@${m.sender.replace(/@.+/, '')}` 
    let mentionedJid = [m.sender] 

    let teks = `⛔ *Perintah Tidak Ditemukan!*\n\nMaaf Kak ${tag}, menu *${usedPrefix + commandOnly}* tidak tersedia di dalam sistem.`

    if (mean && som >= 60) {
        teks += `\n\n*Apakah yang Anda maksud:*\n> ◦ ${usedPrefix + mean}\n> ◦ Kemiripan: ${parseInt(som)}%`

        let isROwner = [conn.user.jid, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
        let isPrems = isROwner || (global.db.data.users[m.sender]?.premiumTime > 0 || global.db.data.users[m.sender]?.premium);
        
        if (isPrems) {
            conn.didyoumean[m.sender] = {
                mean: usedPrefix + mean,
                time: Date.now()
            };
        }
    }

    conn.reply(m.chat, teks, m, { contextInfo: { mentionedJid } })
}

module.exports = handler