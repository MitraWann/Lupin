let WAMessageStubType = null

let urlRegex    = require('url-regex-safe')({ strict: false })
let PhoneNumber = require('awesome-phonenumber')
let chalk       = require('chalk')
let fs          = require('fs')

// [FIX] global.opts['img'] diakses di top-level sebelum global.opts siap → crash
// Pindahkan ke dalam fungsi, baca saat runtime bukan saat module di-load
// terminalImage juga di-require secara lazy agar tidak crash jika opts belum ada
let _terminalImage = null
function getTerminalImage() {
    if (!global.opts?.['img']) return null
    if (!_terminalImage) {
        try { _terminalImage = require('terminal-image') } catch { _terminalImage = false }
    }
    return _terminalImage || null
}

module.exports = async function (m, conn = { user: {} }) {
    // ── Load WAMessageStubType sekali ────────────────────────
    if (!WAMessageStubType) {
        try {
            const { loadBaileys } = await import('../baileys-loader.mjs')
            const baileys = await loadBaileys()
            WAMessageStubType = baileys.WAMessageStubType
                || baileys.default?.WAMessageStubType
                || baileys.proto?.MessageStubType
                || {}
        } catch (e) {
            WAMessageStubType = {}
            console.error('[print.js] Gagal load WAMessageStubType:', e.message)
        }
    }

    // [FIX] conn.getName adalah async — harus di-await agar dapat string nama,
    // bukan Promise object yang selalu truthy
    let _name = await conn.getName(m.sender).catch(() => '')
    let sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') +
        (_name ? ' ~' + _name : '')

    let chat = await conn.getName(m.chat).catch(() => '')

    // ── Terminal image (opsional) ─────────────────────────────
    let img
    try {
        const terminalImage = getTerminalImage()
        // [FIX #6] Tambahkan guard typeof m.download === 'function'
        // m.download hanya ada jika m.msg.url tersedia (di-set di smsg)
        // Jika bukan media, m.download = undefined → crash tanpa guard ini
        if (terminalImage && /sticker|image/gi.test(m.mtype) && typeof m.download === 'function')
            img = await terminalImage.buffer(await m.download())
    } catch (e) {
        console.error('[print.js] terminal-image error:', e.message)
    }

    // ── Filesize ──────────────────────────────────────────────
    let filesize = (m.msg
        ? m.msg.vcard ? m.msg.vcard.length
            : m.msg.fileLength ? m.msg.fileLength.low || m.msg.fileLength
            : m.msg.axolotlSenderKeyDistributionMessage ? m.msg.axolotlSenderKeyDistributionMessage.length
            : m.text ? m.text.length : 0
        : m.text ? m.text.length : 0) || 0

    let user = global.DATABASE?.data?.users[m.sender]
    let me   = PhoneNumber('+' + (conn.user?.jid || '').replace('@s.whatsapp.net', '')).getNumber('international')

    // [FIX] Konstanta 1009 → 1024 untuk konversi KB/MB/GB yang akurat
    const fileSizeUnit  = filesize === 0 ? 0
        : (filesize / 1024 ** Math.floor(Math.log(filesize) / Math.log(1024))).toFixed(1)
    const fileSizeLabel = ['', ...'KMGTP'][Math.floor(Math.log(Math.max(filesize, 1)) / Math.log(1024))] || ''

    console.log(`▣────────────···
│ ${chalk.redBright('%s')}
│⏰ㅤ${chalk.black(chalk.bgYellow('%s'))}
│📑ㅤ${chalk.black(chalk.bgGreen('%s'))}
│📊ㅤ${chalk.magenta('%s [%s %sB]')}
│📤ㅤ${chalk.green('%s')}
│📃ㅤ${chalk.yellow('%s%s')}
│📥ㅤ${chalk.green('%s')}
│💬ㅤ${chalk.black(chalk.bgYellow('%s'))}
▣────────────···`.trim(),
        me + ' ~' + (conn.user?.name || ''),
        new Date(1000 * (m.messageTimestamp?.low || m.messageTimestamp || Date.now() / 1000)).toTimeString(),
        m.messageStubType ? WAMessageStubType[m.messageStubType] : '',
        filesize,
        fileSizeUnit,
        fileSizeLabel,
        sender,
        m.exp ?? '?',
        user ? '|' + user.exp + '|' + user.limit : '',
        m.chat + (chat ? ' ~' + chat : ''),
        m.mtype
            ? m.mtype.replace(/message$/i, '')
                     .replace('audio', m.msg?.ptt ? 'PTT' : 'audio')
                     .replace(/^./, v => v.toUpperCase())
            : ''
    )

    if (img) console.log(img.trimEnd())

    // ── Log teks pesan ────────────────────────────────────────
    if (typeof m.text === 'string' && m.text) {
        let log = m.text.replace(/\u200e+/g, '')
        let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
        let mdFormat = (depth = 4) => (_, type, text, monospace) => {
            let types = { _: 'italic', '*': 'bold', '~': 'strikethrough' }
            text = text || monospace
            return !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)))
        }
        if (log.length < 4096) {
            log = log.replace(urlRegex, (url, i, text) => {
                let end = url.length + i
                return i === 0 || end === text.length ||
                    (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1]))
                    ? chalk.blueBright(url) : url
            })
        }
        log = log.replace(mdRegex, mdFormat(4))
        if (m.mentionedJid) {
            for (let user of m.mentionedJid) {
                // [FIX] conn.getName adalah async — di-await
                let mentionName = await conn.getName(user).catch(() => user.split('@')[0])
                log = log.replace('@' + user.split`@`[0], chalk.blueBright('@' + mentionName))
            }
        }
        console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log)
    }

    // ── Log stub parameters (mention di sistem pesan) ─────────
    if (m.messageStubParameters) {
        console.log(
            // [FIX] conn.getName adalah async — gunakan Promise.all agar semua nama di-await
            (await Promise.all(
                m.messageStubParameters.map(async (jid) => {
                    jid = conn.decodeJid(jid)
                    let name = await conn.getName(jid).catch(() => '')
                    return chalk.gray(
                        PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international') +
                        (name ? ' ~' + name : '')
                    )
                })
            )).join(', ')
        )
    }

    // ── Log tipe media ────────────────────────────────────────
    if (/document/i.test(m.mtype))
        console.log(`📄 ${m.msg.filename || m.msg.displayName || 'Document'}`)
    else if (/ContactsArray/i.test(m.mtype))
        console.log(`👨‍👩‍👧‍👦`)
    else if (/contact/i.test(m.mtype))
        console.log(`👨 ${m.msg.displayName || ''}`)
    else if (/audio/i.test(m.mtype)) {
        let s = m.msg.seconds || 0
        console.log(`${m.msg.ptt ? '🎤 (PTT ' : '🎵 ('}AUDIO) ${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`)
    }

    console.log()
}

// ── Hot-reload watcher ────────────────────────────────────────
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'lib/print.js'"))
    delete require.cache[file]
    require(file)
})
