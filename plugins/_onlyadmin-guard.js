let handler = m => m

handler.before = async function (m, { conn, isAdmin, isOwner }) {
    // Abaikan pesan dari bot itu sendiri
    if (m.isBaileys || m.fromMe) return
    
    // Ambil settingan bot dari database
    // [FIX] Baca dari global.opts['self'] — sinkron dengan handler.js dan self.js
    let isCommand = m.text && /^[./!#]/.test(m.text)
    if (!isCommand) return

    // Self mode aktif — blokir semua non-owner di grup maupun PC
    if (global.opts['self'] && !isOwner) {
        m.text = ''
        return true
    }

    // OnlyAdmin mode — baca dari settings DB
    let setting = global.db.data.settings?.[conn.user.jid] || {}
    if (m.isGroup && setting.onlyAdmin && !isAdmin && !isOwner) {
        m.text = ''
        return true
    }
    if (!m.isGroup && setting.onlyAdmin && setting.selfAdmin && !isOwner) {
        m.text = ''
        return true
    }
}

module.exports = handler