let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { conn, text }) => {
    // 1. Ekstrak kode dari link
    let [_, code] = text.match(linkRegex) || []
    if (!code) throw '⚠️ Link invalid! Masukkan link undangan grup WhatsApp yang benar.'
    
    await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } })

    try {
        // 2. Eksekusi Join Grup
        // res sekarang langsung berisi JID grup (contoh: 123456789@g.us)
        let res = await conn.groupAcceptInvite(code)
        
        // 3. Ambil data nama grup (Opsional, agar balasan lebih elegan)
        let groupName = res // Fallback jika gagal ambil nama
        try {
            let metadata = await conn.groupMetadata(res)
            if (metadata && metadata.subject) groupName = metadata.subject
        } catch (err) {
            console.log("Gagal mengambil metadata grup setelah join.")
        }

        // 4. Kirim konfirmasi
        m.reply(`✅ *BERHASIL JOIN*\n\n> 🏢 *Grup:* ${groupName}\n> 🆔 *ID:* ${res}`)
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        console.error(e)
        m.reply('❌ *Gagal bergabung!*\n\n> Kemungkinan link sudah di-reset, grup penuh, atau bot pernah di-kick dari grup tersebut.')
    }
}

handler.help = ['join <chat.whatsapp.com>']
handler.tags = ['tools']
handler.command = /^join$/i
handler.premium = true

module.exports = handler