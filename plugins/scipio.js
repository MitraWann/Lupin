process.env.TZ = 'Asia/Makassar'
let moment = require('moment-timezone')

const allTags = {
    'keuangan': 'MENU KEUANGAN',
    'asisten': 'MENU ASISTEN',
    'god': '⚙️ ROOT COMMANDS'
}

const defaultMenu = {
    before: `
Halo Tuan %name

Anda mengakses _*Superuser Area*_.
Berhati-hatilah dalam menggunakan perintah eksekutif di bawah ini.

┌  ◦ Uptime : %uptime
│  ◦ Tanggal : %date
│  ◦ Waktu : %time WITA
└  ◦ Prefix Used : *[ %p ]*
`.trimStart(),
    header: '┌  ◦ *%category*',
    body: '│  ◦ %cmd %islimit %isPremium',
    footer: '└  '
}

let handler = async (m, { conn, usedPrefix: _p, command, isOwner }) => {
    try {
        // ==========================================
        // SISTEM PENYAMARAN (FAKE 404)
        // Jika bukan owner ATAU jika perintah dieksekusi di grup, 
        // bot pura-pura tidak mengenali perintah ini.
        // Format disamakan persis dengan _didyoumean.js
        // ==========================================
        if (!isOwner || m.isGroup) {
            let tag = `@${m.sender.replace(/@.+/, '')}`
            let mentionedJid = [m.sender]
            let teks = `❌ *Perintah Tidak Ditemukan!*\n\nMaaf Kak ${tag}, menu *${_p + command}* tidak tersedia di dalam sistem.`
            return conn.reply(m.chat, teks, m, { contextInfo: { mentionedJid } })
        }

        let name = `@${m.sender.split`@`[0]}`
        
        let d = new Date(new Date + 3600000)
        let locale = 'id'
        let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        let time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' })

        let _uptime = process.uptime() * 1000
        let uptime = clockString(_uptime)
        
        // Mengumpulkan daftar semua plugin aktif
        let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
            return {
                help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
                tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
                prefix: 'customPrefix' in plugin,
                limit: plugin.limit,
                premium: plugin.premium
            }
        })

        let hiddenCategories = ['god', 'asisten', 'keuangan'];
        let hiddenMenu = defaultMenu.before + '\n\n';
        
        for (let tag of hiddenCategories) {
            if (allTags[tag]) {
                hiddenMenu += defaultMenu.header.replace(/%category/g, allTags[tag]) + '\n';
                let tagCommands = help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help);
                
                let formattedCommands = [];
                for (let menu of tagCommands) {
                    for (let helpItem of menu.help) {
                        if (!helpItem) continue;
                        formattedCommands.push({
                            name: helpItem,
                            str: defaultMenu.body
                                .replace(/%cmd/g, menu.prefix ? helpItem : _p + helpItem)
                                .replace(/%islimit/g, menu.limit ? '(Ⓛ)' : '')
                                .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '')
                        });
                    }
                }
                
                // Sort A-Z
                formattedCommands.sort((a, b) => String(a.name).localeCompare(String(b.name)));
                hiddenMenu += formattedCommands.map(c => c.str).join('\n') + '\n';
                hiddenMenu += defaultMenu.footer + '\n';
            }
        }
        
        hiddenMenu += '\n_Akses Root dikonfirmasi._';

        let replaceHidden = { '%': '%', p: _p, uptime, name, date, time };
        let textHidden = hiddenMenu.replace(new RegExp(`%(${Object.keys(replaceHidden).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replaceHidden[name]);

        // Mengirimkan UI Spesial untuk ROOT
        return await conn.relayMessage(m.chat, {
            extendedTextMessage:{
                text: textHidden, 
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: 'ROOT ACCESS GRANTED',
                        body: 'Welcome Owner Mitraaa',
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://files.catbox.moe/stkbn0.png',
                        sourceUrl: ''
                    }
                }, 
                mentions: [m.sender]
            }
        }, {});

    } catch (e) {
        conn.reply(m.chat, 'Gagal memuat menu rahasia', m)
        console.error(e)
    }
}

// Tidak menggunakan handler.owner = true agar pencegatan dikelola secara manual di atas
handler.tags = ['god'] 
handler.command = /^scipio$/i

module.exports = handler

function clockString(ms) {
    if (isNaN(ms)) return '--'
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}