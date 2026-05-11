let handler = async (m, { conn, command, usedPrefix }) => {
    let setting = global.db.data.settings[conn.user.jid]
    if (!setting) {
        global.db.data.settings[conn.user.jid] = {}
        setting = global.db.data.settings[conn.user.jid]
    }

    let isSelf = /self|selfmode|private-mode/i.test(command)
    let isPublic = /public/i.test(command)

    try {
        if (isSelf) {
            // Menggunakan variabel kustom agar sistem inti tidak memblokir Owner
            if (setting.modeSelfCustom) return m.reply('ℹ️ Bot sudah dalam mode *self*')

            setting.modeSelfCustom = true
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
            if (!setting.modeSelfCustom) return m.reply('ℹ️ Bot sudah dalam mode *public*')

            setting.modeSelfCustom = false
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

// ==========================================
// PENYELAMATAN DARURAT (AUTO-RESCUE)
// ==========================================
// Ini akan otomatis mematikan gembok bawaan script yang mengunci Boss
setTimeout(() => {
    if (global.opts) global.opts['self'] = false;
}, 2000);

module.exports = handler