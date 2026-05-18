let handler = async (m, { conn, command, usedPrefix }) => {
    let isSelf = /self|selfmode|private-mode/i.test(command)
    let isPublic = /public/i.test(command)

    try {
        if (isSelf) {
            if (global.opts['self']) return m.reply('ℹ️ Bot sudah dalam mode *self*')
            global.opts['self'] = true
            if (!global.db.data.settings) global.db.data.settings = {}
            global.db.data.settings.self = true
            await conn.sendMessage(m.chat, { react: { text: '🔒', key: m.key } })
            return m.reply(
                `🔒 *ᴍᴏᴅᴇ sᴇʟꜰ ᴀᴋᴛɪꜰ*\n\n` +
                `> Bot sekarang hanya merespon:\n` +
                `> • Owner bot\n` +
                `> • Bot sendiri (fromMe)\n\n` +
                `_Gunakan ${usedPrefix}public untuk membuka akses_`
            )
        }

        if (isPublic) {
            if (!global.opts['self']) return m.reply('ℹ️ Bot sudah dalam mode *public*')
            global.opts['self'] = false
            if (!global.db.data.settings) global.db.data.settings = {}
            global.db.data.settings.self = false
            await conn.sendMessage(m.chat, { react: { text: '🔓', key: m.key } })
            return m.reply(
                `🔓 *ᴍᴏᴅᴇ ᴘᴜʙʟɪᴄ ᴀᴋᴛɪꜰ*\n\n` +
                `> Bot sekarang dapat diakses oleh semua orang.\n\n` +
                `_Gunakan ${usedPrefix}self untuk menutup akses_`
            )
        }
    } catch (error) {
        console.error('[Self Command Error]', error)
        await m.reply(`❌ Error: ${error.message}`)
    }
}

handler.help = ['self', 'public']
handler.tags = ['owner']
handler.command = /^(self|selfmode|private-mode|public)$/i
handler.owner = true

module.exports = handler