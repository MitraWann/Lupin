/**
 * Plugin Cek Token
 * Menampilkan saldo token pengguna saat ini.
 */

let handler = async (m, { conn, isOwner }) => {
    // Ambil data user dari database
    let user = global.db.data.users[m.dbSender || m.sender]
    
    // Logika pengecualian (Unlimited khusus Owner)
    let tokenStr = isOwner ? 'Unlimited ♾️ (Owner)' : `${user.token} Poin`
    
    // Susun pesan balasan
    let caption = `*🎟️ INFO TOKEN USER 🎟️*\n\n`
    caption += `👤 *User:* @${m.sender.split('@')[0]}\n`
    caption += `💠 *Token:* ${tokenStr}\n\n`
    caption += `_💡 Token khusus digunakan untuk mengakses fitur-fitur eksklusif._`
    
    // Kirim pesan dengan tag/mention
    await conn.sendMessage(m.chat, { 
        text: caption, 
        mentions: [m.sender] 
    }, { quoted: m })
}

handler.help = ['cektoken', 'token']
handler.tags = ['xp']
handler.command = /^(cektoken|token)$/i

module.exports = handler