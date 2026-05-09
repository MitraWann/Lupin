let handler = m => m

handler.before = async function (m, { conn, isOwner }) {
    let setting = global.db.data.settings[conn.user.jid] || {}

    // Cek apakah m.text ada isinya
    if (!m.text) return

    // Jika mode Self kustom kita sedang AKTIF
    if (setting.modeSelfCustom) {
        // Jika yang chat BUKAN bot itu sendiri (fromMe) DAN BUKAN Owner
        if (!m.fromMe && !isOwner) {
            // Bajak dan kosongkan teksnya agar bot diam 
            m.text = '' 
            return true // Hentikan proses bot untuk orang ini
        }
    }
}

module.exports = handler