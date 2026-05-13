// ==========================================
// BAGIAN 1: SAKLAR ON / OFF (COMMAND)
// ==========================================
let handler = async (m, { conn, args, usedPrefix, command }) => {
    // Kita simpan pengaturan ini di database pengaturan global bot
    let botJid = conn.user.jid
    
    // Pastikan database pengaturan tersedia
    if (!global.db.data.settings[botJid]) global.db.data.settings[botJid] = {}
    let settings = global.db.data.settings[botJid]

    // Default menyala jika belum pernah diatur
    if (typeof settings.autotyping === 'undefined') settings.autotyping = true 

    // Logika Saklar
    if (args[0] === 'on') {
        settings.autotyping = true
        m.reply('✅ *Autotyping DINYALAKAN*\n\nBot sekarang akan terlihat "sedang mengetik..." saat membalas perintah.')
    } 
    else if (args[0] === 'off') {
        settings.autotyping = false
        m.reply('❌ *Autotyping DIMATIKAN*\n\nBot sekarang akan membalas pesan secara diam-diam (instan).')
    } 
    else {
        // Panduan jika Boss salah ketik
        let statusSaatIni = settings.autotyping ? '🟢 ON' : '🔴 OFF'
        m.reply(
            `*Format Saklar Salah!*\n\n` +
            `Gunakan perintah:\n` +
            `> *${usedPrefix + command} on* (menyalakan)\n` +
            `> *${usedPrefix + command} off* (mematikan)\n\n` +
            `Status saat ini: *${statusSaatIni}*`
        )
    }
}

// ==========================================
// BAGIAN 2: MESIN OTOMATIS (BACKGROUND)
// ==========================================
handler.before = async function (m) {
    let conn = this || global.conn
    let botJid = conn.user.jid

    // Ambil status saklar dari database
    let settings = global.db.data.settings[botJid] || {}
    if (typeof settings.autotyping === 'undefined') settings.autotyping = true 

    // 1. JIKA SAKLAR OFF, HENTIKAN PROSES! (Bot tidak akan mengetik)
    if (!settings.autotyping) return

    // 2. Abaikan pesan kosong atau pesan dari bot sendiri
    if (!m.text || m.fromMe) return

    // 3. Deteksi apakah pesan yang masuk adalah perintah (Command)
    let isCommand = /^[\\/!#.\-]/i.test(m.text)

    // 4. Jika itu perintah, dan saklar ON, jalankan efeknya!
    if (isCommand) {
        try {
            await conn.sendPresenceUpdate('composing', m.chat)
        } catch (e) {
            console.error('Gagal menampilkan status mengetik:', e)
        }
    }
}

// ==========================================
// KONFIGURASI PLUGIN
// ==========================================
handler.help = ['autotyping <on/off>']
handler.tags = ['owner']
handler.command = /^(autotyping|ketik)$/i

// KUNCI PENGAMAN: Hanya Boss (Owner) yang bisa mainin saklar ini!
handler.owner = true 

module.exports = handler