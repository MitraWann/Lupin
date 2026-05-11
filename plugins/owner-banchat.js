let handler = async (m, { conn, args }) => {
    let chat = m.chat
    if (args[0] && args[0].endsWith('g.us')) chat = args[0]

    let chats = global.db.data.chats || {}
    if (!chats[chat]) chats[chat] = {}

    try {
        // Menggunakan variabel kustom 'isMuted' agar tidak diblokir sistem inti
        if (chats[chat].isMuted) {
            return m.reply('ℹ️ Bot sudah dalam keadaan bisu di chat ini.')
        }

        chats[chat].isMuted = true

        await conn.sendMessage(m.chat, { react: { text: '🔇', key: m.key } })
        await conn.sendMessage(chat, { 
            text: `🔇 *BAN CHAT AKTIF*\n\n> Bot telah dinonaktifkan di obrolan ini oleh Owner.\n> Bot tidak akan merespons pesan apapun dari member biasa.` 
        })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mencoba mem-ban chat ini.')
    }
}

handler.help = ['banchat', 'mute']
handler.tags = ['owner']
handler.command = /^(banchat|mute|bangrup)$/i
handler.owner = true

module.exports = handler