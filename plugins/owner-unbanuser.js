let handler = async (m, { conn, args, usedPrefix, command }) => {
    // 1. Panduan Penggunaan
    if (!m.quoted && !args[0]) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `*Cara Penggunaan:*\n` +
            `> ◦ ${usedPrefix + command} @user\n` +
            `> ◦ ${usedPrefix + command} 628xxx\n` +
            `> ◦ Reply pesan target -> ${usedPrefix + command}`
        )
    }

    // 2. Menentukan Target User (Bisa via Reply, Tag, atau ketik Nomor)
    let who;
    if (m.isGroup) {
        who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : '';
    } else {
        who = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.quoted ? m.quoted.sender : '';
    }

    if (!who || who === conn.user.jid) throw '⚠️ Tag/Reply pesan target atau masukkan nomornya dengan benar.';
    
    // 3. Memeriksa Database
    let users = global.db.data.users;
    if (!users[who]) throw '❌ Target tidak ditemukan di database bot.';

    try {
        // Jika status user memang tidak di-ban
        if (!users[who].banned) {
            return m.reply('ℹ️ User tersebut memang tidak sedang diblokir.');
        }

        // 4. Eksekusi Unban (Reset status dan timer)
        users[who].banned = false;
        users[who].bannedTime = 0; 

        let targetName = await conn.getName(who) || who.split('@')[0];

        // 5. Notifikasi Berhasil
        let teks = `✅ *UNBANNED SUCCESS*\n\n` +
                   `> 👤 *Target:* ${targetName}\n\n` +
                   `_User ini telah dibuka blokirnya dan dapat kembali menggunakan bot._`;

        await m.reply(teks);
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        throw `❌ Gagal membuka blokir pada nomor tersebut.`;
    }
}

handler.help = ['unban @user']
handler.tags = ['owner']
handler.command = /^unban$/i
handler.owner = true

module.exports = handler