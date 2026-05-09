let handler = m => m

handler.before = async function (m, { conn, isAdmin, isOwner }) {
    // Abaikan pesan dari bot itu sendiri
    if (m.isBaileys || m.fromMe) return
    
    // Ambil settingan bot dari database
    let setting = global.db.data.settings[conn.user.jid] || {}

    // Deteksi apakah pesan tersebut adalah perintah bot (menggunakan awalan seperti . ! / #)
    let isCommand = m.text && /^[./!#]/.test(m.text)

    // Jika bukan perintah (chat biasa), biarkan lewat
    if (!isCommand) return

    // ==========================================
    // 1. BLOKIR DI DALAM GRUP (OnlyAdmin / PublicAdmin)
    // ==========================================
    if (m.isGroup && setting.onlyAdmin) {
        // Jika dia BUKAN admin grup dan BUKAN owner bot
        if (!isAdmin && !isOwner) {
            // Hapus isi teks perintahnya agar tidak bisa dibaca oleh sistem plugin
            m.text = '' 
            
            // Opsional: Kirim notifikasi penolakan (Hapus tanda // di bawah jika ingin bot membalas)
            // await m.reply('⚠️ *Akses Ditolak!*\n\nBot sedang dalam mode *OnlyAdmin*. Hanya Admin grup yang dapat menggunakan bot ini.')
            
            return true // Hentikan eksekusi kode bot lebih lanjut
        }
    }

    // ==========================================
    // 2. BLOKIR DI PRIVATE CHAT (SelfAdmin)
    // ==========================================
    // Jika SelfAdmin aktif, orang lain (bukan owner) tidak bisa chat bot di PC
    if (!m.isGroup && setting.onlyAdmin && setting.selfAdmin) {
        if (!isOwner) {
            m.text = ''
            return true
        }
    }
}

module.exports = handler