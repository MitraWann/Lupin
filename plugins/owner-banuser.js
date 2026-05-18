let handler = async (m, { conn, args, usedPrefix, command }) => {
    // 1. Panduan Penggunaan
    if (!m.quoted && !args[0]) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `*Cara Penggunaan:*\n` +
            `> ◦ ${usedPrefix + command} @user\n` +
            `> ◦ ${usedPrefix + command} 628xxx 3d (Ban 3 hari)\n` +
            `> ◦ ${usedPrefix + command} @user 12h (Ban 12 jam)\n` +
            `> ◦ Reply pesan target -> ${usedPrefix + command} 30m (Ban 30 menit)\n\n` +
            `*Satuan Waktu:*\n` +
            `> *m* = Menit, *h* = Jam, *d* = Hari`
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

    // [FIX] Resolve LID → JID sebelum akses DB
    if (who.endsWith('@lid')) who = (await conn.getJid(who).catch(() => null)) || who

    // 3. Eksekusi Durasi Waktu (Parsing Timer)
    let durationStr = args.find(v => /^[0-9]+[mhd]$/i.test(v));
    let durationMs = 0;
    let timeTxt = "♾️ Permanen";

    if (durationStr) {
        let val = parseInt(durationStr.slice(0, -1));
        let unit = durationStr.slice(-1).toLowerCase();
        
        if (unit === 'd') { 
            durationMs = val * 24 * 60 * 60 * 1000; 
            timeTxt = `${val} Hari`; 
        } else if (unit === 'h') { 
            durationMs = val * 60 * 60 * 1000; 
            timeTxt = `${val} Jam`; 
        } else if (unit === 'm') { 
            durationMs = val * 60 * 1000; 
            timeTxt = `${val} Menit`; 
        }
    }

    // 4. Memasukkan ke Database
    let users = global.db.data.users;
    if (!users[who]) throw '❌ Target tidak ditemukan di database bot.';

    try {
        users[who].banned = true;
        
        // Simpan waktu kadaluarsa (Expired time)
        if (durationMs > 0) {
            users[who].bannedTime = Date.now() + durationMs; 
        } else {
            users[who].bannedTime = 0; // 0 = Permanen
        }

        let targetName = await conn.getName(who) || who.split('@')[0];

        // 5. Notifikasi Berhasil
        let teks = `🔨 *BANNED SUCCESS*\n\n` +
                   `> 👤 *Target:* ${targetName}\n` +
                   `> ⏱️ *Durasi:* ${timeTxt}\n\n` +
                   `_User ini telah diblokir dan tidak bisa menggunakan bot._`;

        await m.reply(teks);
        await conn.sendMessage(m.chat, { react: { text: '🔨', key: m.key } });

    } catch (e) {
        console.error(e);
        throw `❌ Gagal melakukan banned pada nomor tersebut.`;
    }
}

handler.help = ['ban @user [timer]']
handler.tags = ['owner']
handler.command = /^ban$/i
handler.owner = true

module.exports = handler