let handler = m => m

handler.before = async function (m, { conn, isOwner }) {
    // Hanya berlaku di dalam grup
    if (!m.isGroup) return
    if (m.isBaileys || m.fromMe) return

    // Ambil data grup saat ini dari database
    let chat = global.db.data.chats[m.chat] || {}

    // Deteksi apakah pesan tersebut adalah perintah bot
    let isCommand = m.text && /^[./!#]/.test(m.text)
    if (!isCommand) return

    // Jika grup ini sedang dalam status BANNED (Bisu)
    if (chat.isBanned) {
        // Jika yang ngetik command BUKAN Owner, bajak pesannya!
        if (!isOwner) {
            m.text = '' // Kosongkan perintahnya agar bot mengabaikannya
            return true // Hentikan proses bot untuk orang ini
        }
        
        // JIKA OWNER YANG NGETIK? 
        // Kode akan mengabaikan blokir ini dan membiarkan perintah Boss dieksekusi oleh bot.
    }
}

module.exports = handler