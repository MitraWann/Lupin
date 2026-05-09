process.env.TZ = 'Asia/Makassar'
let fs      = require('fs')
let path    = require('path')
let moment  = require('moment-timezone')
let levelling = require('../lib/levelling')

// ── [FIX] Peta emoji untuk tag yang sudah dikenal ────────────────────────────
// Tag yang tidak ada di sini akan tetap muncul di menu dengan label auto-generate:
//   "📌 MENU NAMATAG" — tidak perlu edit kode saat ada plugin baru.
// Untuk kustomisasi emoji tag baru, cukup tambahkan entri di sini.
const knownTagLabels = {
    'all':        '🗂️ MENU ALL',
    'tulipnex':   '📊 TULIPNEX (CBE)',
    'efootball':  '⚽ eFootball',
    'ai':         '🤖 MENU AI',
    'main':       '🏠 MENU UTAMA',
    'downloader': '📥 MENU DOWNLOADER',
    'database':   '📂 MENU DATABASE',
    'rpg':        '⚔️ MENU RPG',
    'sticker':    '🎨 MENU CONVERT',
    'advanced':   '⚙️ ADVANCED',
    'xp':         '✨ MENU EXP',
    'fun':        '🎡 MENU FUN',
    'game':       '🎮 MENU GAME',
    'github':     '💻 MENU GITHUB',
    'group':      '👥 MENU GROUP',
    'info':       '📑 MENU INFO',
    'internet':   '🌐 INTERNET',
    'islam':      '🕌 MENU ISLAMI',
    'maker':      '🏗️ MENU MAKER',
    'news':       '📰 MENU NEWS',
    'owner':      '👑 MENU OWNER',
    'voice':      '🎙️ PENGUBAH SUARA',
    'store':      '🛒 MENU STORE',
    'stalk':      '🕵️ MENU STALK',
    'shortlink':  '🔗 SHORT LINK',
    'tools':      '🧰 MENU TOOLS',
    'anonymous':  '🎭 ANONYMOUS CHAT',
}

// Tag yang tidak pernah ditampilkan ke user biasa
const hiddenCategories = ['god', 'asisten']

// ── [BARU] Auto-detect tags dari semua plugin yang aktif ─────────────────────
// Menggantikan arrayMenu & allTags yang sebelumnya hardcoded.
// Urutan: tag dikenal (sesuai knownTagLabels) → tag baru (alfabetis)
// Tag hidden dan tag tanpa nama ('') difilter otomatis.
function buildTagMap() {
    const detected = new Set()

    for (const plugin of Object.values(global.plugins || {})) {
        if (!plugin || plugin.disabled) continue
        const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags]
        for (const tag of tags) {
            if (tag && typeof tag === 'string' && tag.trim()) {
                detected.add(tag.trim())
            }
        }
    }

    const tagMap = {}

    // 1. Selalu sertakan 'all' di posisi pertama
    tagMap['all'] = knownTagLabels['all']

    // 2. Tag dikenal, dalam urutan knownTagLabels, hanya jika ada plugin-nya
    for (const [tag, label] of Object.entries(knownTagLabels)) {
        if (tag === 'all') continue
        if (hiddenCategories.includes(tag)) continue
        if (detected.has(tag)) tagMap[tag] = label
    }

    // 3. Tag baru yang tidak ada di knownTagLabels (plugin baru ditambahkan)
    for (const tag of [...detected].sort()) {
        if (tag in tagMap) continue
        if (hiddenCategories.includes(tag)) continue
        // Auto-generate label dengan emoji default
        tagMap[tag] = `📌 MENU ${tag.toUpperCase()}`
    }

    return tagMap
}

const defaultMenu = {
    before: `
Halo %name 👋,
Selamat datang di pusat kontrol.

*S T A T U S  S Y S T E M*
 ⚬ *Waktu* : %time WITA
 ⚬ *Tanggal* : %date
 ⚬ *Prefix* : [ %p ]
`.trimStart(),
    header: '\n*%category*',
    body:   '  ● %cmd %islimit %isPremium',
    footer: '',
    after:  `\n> *Hint:* Ketik *%pmenu <kategori>* untuk membuka menu.\n\n> Contoh: *%pmenu main*`
}

let handler = async (m, { conn, usedPrefix: _p, args = [], command, isOwner }) => {
    try {
        // [FIX] Gunakan m.dbSender (sudah dinormalisasi dari LID) untuk akses DB
        // m.sender boleh masih @lid jika dari linked device
        let dbKey = m.dbSender || m.sender
        let { exp, limit, level, role } = global.db.data.users[dbKey] || {}

        let name = `@${m.sender.split('@')[0]}`
        let teks = (args[0] || '').toLowerCase().trim()

        // [FIX] new Date(new Date + 3600000) — `new Date` tanpa () menghasilkan string
        // bukan timestamp, sehingga aritmatika string + number = NaN → tanggal Invalid.
        // Fix: gunakan Date.now() yang selalu menghasilkan number.
        let d      = new Date(Date.now() + 3600000)
        let locale = 'id'
        let date   = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        let time   = d.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' })

        let _uptime = process.uptime() * 1000
        let uptime  = clockString(_uptime)

        // [BARU] Bangun tagMap secara dinamis dari plugin yang aktif
        const allTags  = buildTagMap()
        const arrayMenu = Object.keys(allTags)

        let help = Object.values(global.plugins).filter(p => !p?.disabled).map(plugin => ({
            help:    Array.isArray(plugin.help)    ? plugin.help    : [plugin.help],
            tags:    Array.isArray(plugin.tags)    ? plugin.tags    : [plugin.tags],
            prefix:  'customPrefix' in plugin,
            limit:   plugin.limit,
            premium: plugin.premium,
            owner:   plugin.owner || plugin.rowner,
            enabled: !plugin.disabled,
        }))

        // Blokir user jika mencoba akses kategori tersembunyi
        if (hiddenCategories.includes(teks) && !isOwner) {
            return m.reply(`Menu "${teks}" tidak tersedia.\nSilakan ketik ${_p}menu untuk melihat daftar menu.`)
        }

        // Helper: render daftar command untuk satu tag
        const renderCommands = (tag) => {
            let cmds = []
            for (let menu of help) {
                if (!menu.tags?.includes(tag) || !menu.help) continue
                for (let helpItem of menu.help) {
                    if (!helpItem) continue
                    cmds.push({
                        name: helpItem,
                        str: defaultMenu.body
                            .replace(/%cmd/g,       menu.prefix ? helpItem : _p + helpItem)
                            .replace(/%islimit/g,   menu.limit   ? ' Ⓛ' : '')
                            .replace(/%isPremium/g, menu.premium ? ' Ⓟ' : '')
                    })
                }
            }
            cmds.sort((a, b) => String(a.name).localeCompare(String(b.name)))
            return cmds.map(c => c.str).join('\n')
        }

        let text = ''

        if (!teks) {
            // ── Tampilan daftar kategori ──────────────────────────────────
            let menuList = `${defaultMenu.before}\n\n*A V A I L A B L E   M E N U S*\n`
            for (let tag of arrayMenu) {
                if (tag && tag !== 'all' && !hiddenCategories.includes(tag)) {
                    menuList += `  ● ${_p}menu ${tag}\n`
                }
            }
            menuList += `\n${defaultMenu.after}`
            text = menuList

        } else if (teks === 'all') {
            // ── Tampilan semua kategori sekaligus ─────────────────────────
            text = defaultMenu.before + '\n'
            for (let tag of arrayMenu) {
                if (tag === 'all' || hiddenCategories.includes(tag)) continue
                const cmds = renderCommands(tag)
                if (!cmds) continue // skip tag yang tidak punya command aktif
                text += defaultMenu.header.replace(/%category/g, allTags[tag]) + '\n'
                text += cmds + '\n'
                if (defaultMenu.footer) text += defaultMenu.footer + '\n'
            }
            text += defaultMenu.after

        } else if (allTags[teks]) {
            // ── Tampilan satu kategori ────────────────────────────────────
            text = defaultMenu.before + '\n'
            text += defaultMenu.header.replace(/%category/g, allTags[teks]) + '\n'
            text += renderCommands(teks) + '\n'
            if (defaultMenu.footer) text += defaultMenu.footer + '\n'
            text += defaultMenu.after

        } else {
            // ── Tag tidak ditemukan ───────────────────────────────────────
            // [BARU] Tampilkan saran tag yang tersedia agar user tidak bingung
            const availableTags = arrayMenu
                .filter(t => t && t !== 'all' && !hiddenCategories.includes(t))
                .map(t => `${_p}menu ${t}`)
                .join('\n')
            return m.reply(
                `Menu *"${teks}"* tidak tersedia.\n\nKategori yang tersedia:\n${availableTags}`
            )
        }

        // ── Substitusi variabel template ──────────────────────────────────
        let replace = { '%': '%', p: _p, uptime, name, date, time, pmenu: _p + 'menu' }
        text = text.replace(
            new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join('|')})`, 'g'),
            (_, key) => '' + replace[key]
        )

        // ── Kirim via relayMessage dengan Rich UI ─────────────────────────
        const newsletterName = teks
            ? `DASHBOARD ${(allTags[teks] || teks).replace(/[^\x00-\x7F]/g, '').trim().toUpperCase()}`
            : 'DASHBOARD'

        await conn.relayMessage(m.chat, {
            extendedTextMessage: {
                text,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid:     '120363407187309269@newsletter',
                        newsletterName,
                        serverMessageId:   127
                    },
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title:                  global.botname,
                        body:                   'Powered by TulipNex',
                        mediaType:              1,
                        previewType:            0,
                        renderLargerThumbnail:  true,
                        thumbnailUrl:           'https://files.catbox.moe/stkbn0.png',
                        sourceUrl:              ''
                    }
                },
                mentions: [m.sender]
            }
        }, {})

    } catch (e) {
        conn.reply(m.chat, 'Maaf, menu sedang error', m)
        console.error(e)
    }
}

handler.help    = ['menu']
handler.tags    = ['main']
handler.command = /^(menu|help)$/i
handler.exp     = 3

module.exports = handler

function clockString(ms) {
    if (isNaN(ms)) return '--'
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}