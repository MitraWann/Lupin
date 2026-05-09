let handler = async (m, { conn, usedPrefix, command }) => {
    // 1. Ambil settingan bot saat ini (Terintegrasi dengan sistem kustom kita)
    let setting = global.db.data.settings[conn.user.jid] || {}
    
    // Cek status mode saat ini
    let modeBot = '🔓 Publik'
    if (setting.modeSelfCustom) modeBot = '🔒 Self'
    else if (setting.onlyAdmin) modeBot = '🛡️ Only Admin'

    // 2. Kalkulasi Uptime (Waktu Aktif)
    let _uptime = process.uptime() * 1000
    let uptimex = clockString(_uptime)

    // 3. Kalkulasi Statistik Database
    let totalUsers = Object.keys(global.db.data.users).length
    let bannedUsers = Object.values(global.db.data.users).filter(user => user.banned).length
    let totalFeatures = Object.keys(global.db.data.stats || {}).length

    // 4. Susun Teks Tampilan
    let teks = `╭┈┈⬡「 *S T A T U S  B O T* 」\n` +
               `┃ 🤖 *Mode:* ${modeBot}\n` +
               `┃ ⏱️ *Aktif:* ${uptimex}\n` +
               `┃ 👥 *Pengguna:* ${totalUsers} user\n` +
               `┃ 🚫 *Terbanned:* ${bannedUsers} user\n` +
               `┃ ⚙️ *Fitur Dipakai:* ${totalFeatures} \n` +
               `╰┈┈⬡\n\n` +
               `> _Jika bot tidak ada balasan maka bot sedang maintenance._`

    // 5. Kirim Pesan dengan AdReply (Kartu Cantik)
    try {
        await conn.relayMessage(m.chat, {
            extendedTextMessage: {
                text: teks, 
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: 'Status Bot',
                        body: `Runtime: ${uptimex}`,
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://files.catbox.moe/stkbn0.png', // Gambar dari Boss
                        sourceUrl: '' // Bisa diisi link web/grup jika mau
                    }
                }
            }
        }, {})
    } catch (e) {
        console.error(e)
        m.reply(teks) // Fallback: Jika sistem relay gagal, tetap kirim teks biasa
    }
}

handler.help = ['mode']
handler.tags = ['main']
handler.customPrefix = /^(mode)$/i 
handler.command = new RegExp
handler.limit = false

module.exports = handler

// Fungsi Waktu yang sudah dirapikan
function clockString(ms) {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    let daysms = ms % (24 * 60 * 60 * 1000);
    let hours = Math.floor((daysms) / (60 * 60 * 1000));
    let hoursms = ms % (60 * 60 * 1000);
    let minutes = Math.floor((hoursms) / (60 * 1000));
    let minutesms = ms % (60 * 1000);
    let sec = Math.floor((minutesms) / (1000));
    
    let result = '';
    if (days > 0) result += days + " Hari ";
    if (hours > 0) result += hours + " Jam ";
    if (minutes > 0) result += minutes + " Menit ";
    result += sec + " Detik";
    return result.trim();
}