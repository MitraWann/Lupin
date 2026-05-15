// plugins/delwan.js
const { remove, list } = require('../lib/cdn-helper')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        const items = list()
        if (!items.length) throw '📭 Database kosong.'
        let msg = '*📋 Daftar Identifier:*\n\n'
        items.forEach((item, i) => {
            msg += `${i + 1}. *${item.id}* (${item.type}) - ${new Date(item.savedAt).toLocaleDateString('id-ID')}\n`
        })
        msg += `\nGunakan *${usedPrefix}${command} <id>* untuk hapus.\nGunakan *${usedPrefix}${command} all* untuk hapus semua.`
        return conn.reply(m.chat, msg, m)
    }

    const input = text.trim().toLowerCase()

    if (input === 'all') {
        const items = list()
        if (!items.length) throw '📭 Database sudah kosong.'
        items.forEach(i => remove(i.id))
        return conn.reply(m.chat, `✅ ${items.length} identifier dihapus.`, m)
    }

    const id = input.replace(/^https?:\/\/mitra\.wan\//, '')
    if (!/^[a-f0-9]{8}$/.test(id)) throw 'Identifier tidak valid (8 karakter hex).'

    const ok = remove(id)
    if (!ok) throw `Identifier *${id}* tidak ditemukan.`
    conn.reply(m.chat, `✅ *${id}* dihapus.`, m)
}

handler.help = ['delwan']
handler.tags = ['tools']
handler.command = /^delwan$/i
module.exports = handler