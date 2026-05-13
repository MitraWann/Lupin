let handler = async (m, { conn, usedPrefix }) => {
    // 1. Ambil data
    let chats = Object.entries(global.db.data.chats).filter(chat => chat[1].isMuted)
    let users = Object.entries(global.db.data.users).filter(user => user[1].banned)
    
    // 2. Format Daftar Chat / Grup
    // Menggunakan Promise.all agar bisa mengambil nama grup secara asinkron (conn.getName)
    let _chatlist = await Promise.all(chats.map(async ([jid], i) => {
        let name = await conn.getName(jid) || jid
        return `> ${i + 1}. ${name}`
    }))

    // 3. Format Daftar User
    let _userlist = users.map(([jid, data], i) => {
        // NORMALISASI: Hapus Device ID (titik dua dan angka di belakangnya) untuk mencegah tag yang rusak
        let normalizedJid = jid.replace(/:\d+/, '')
        let number = normalizedJid.split('@')[0]
        
        // Cek apakah ban memiliki timer atau permanen
        let timeInfo = (data.bannedTime && data.bannedTime > 0) ? '⏳ Berwaktu' : '♾️ Permanen'
        return `> ${i + 1}. @${number} _(${timeInfo})_`
    })

    // 4. Susun Tata Letak (Layout) Teks
    let teks = `🚫 *DAFTAR BLOKIR BOT* 🚫\n\n`
    
    teks += `🏢 *GRUP DIBISUKAN (Muted)*\n`
    teks += `Total: *${chats.length}* Grup\n`
    teks += _chatlist.length > 0 ? _chatlist.join('\n') : `> _Tidak ada grup yang dibisukan_\n`
    teks += `\n`

    teks += `👤 *USER TERBANNED*\n`
    teks += `Total: *${users.length}* User\n`
    teks += _userlist.length > 0 ? _userlist.join('\n') : `> _Tidak ada user yang dibanned_\n`
    teks += `\n\n`

    teks += `_Gunakan perintah ${usedPrefix}unbanchat atau ${usedPrefix}unban untuk mencabut blokir._`
    
    // 5. Ekstrak dan Normalisasi semua JID user agar tag (@nomor) aktif secara fungsional
    let mentions = users.map(([jid]) => jid.replace(/:\d+/, ''))

    // 6. Kirim Pesan menggunakan struktur contextInfo (lebih stabil untuk tag di Baileys)
    conn.reply(m.chat, teks, m, { contextInfo: { mentionedJid: mentions } })
}

handler.help = ['bannedlist']
handler.tags = ['info']
handler.command = /^(listbanned|bannedlist|daftarbanned|listban)$/i
handler.owner = false

module.exports = handler