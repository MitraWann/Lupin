let handler = async (m, { conn, args }) => {
    let chat = m.chat
    if (args[0] && args[0].endsWith('g.us')) chat = args[0]

    let chats = global.db.data.chats || {}
    if (!chats[chat]) chats[chat] = {}

    try {
        if (!chats[chat].isMuted) {
            return m.reply('ℹ️ Bot memang sudah aktif di chat ini.')
        }

        chats[chat].isMuted = false

        await conn.sendMessage(m.chat, { react: { text: '🔊', key: m.key } })
        await conn.sendMessage(chat, { 
            text: `🔊 *UNBAN CHAT BERHASIL*\n\n> Bot telah dihidupkan kembali di obrolan ini.\n> Bot siap menerima perintah dari semua orang!` 
        })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mencoba unban chat ini.')
    }
}

handler.help = ['unbanchat', 'unmute']
handler.tags = ['owner']
handler.command = /^(unbanchat|unmute|unbangrup)$/i
handler.owner = true

module.exports = handler