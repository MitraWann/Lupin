const { loadBaileys } = require('../baileys-loader.mjs');
let baileys;

let handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!baileys) {
        baileys = await loadBaileys();
    }

    let isList = /listsewa/i.test(command);
    let isCek = /ceksewa|csewa/i.test(command);

    // Ambil semua grup yang masa sewanya masih aktif (lebih besar dari jam sekarang)
    let sewaList = Object.entries(global.db.data.chats)
        .filter(([_, chat]) => chat.expired && chat.expired > Date.now())
        .map(([id, _]) => id);

    // ==========================================
    // LOGIKA: LIST SEWA
    // ==========================================
    if (isList) {
        if (sewaList.length === 0) {
            return m.reply('ℹ️ *Tidak ada grup yang memiliki masa sewa aktif saat ini.*');
        }

        // Tarik nama grup secara asinkron (lebih cepat)
        let listItems = await Promise.all(sewaList.map(async (chatId, i) => {
            let remainingTime = global.db.data.chats[chatId].expired - Date.now();
            let name = await conn.getName(chatId) || 'Grup Tidak Dikenal';

            return `> *${i + 1}. ${name}*\n` +
                   `> 🆔 ID: ${chatId}\n` +
                   `> ⏳ Sisa: *${msToDate(remainingTime)}*`;
        }));

        let caption = `👑 *DAFTAR GRUP PREMIUM (SEWA)* 👑\n\n` +
                      `Total: *${sewaList.length}* Grup Aktif\n\n` +
                      `${listItems.join('\n\n')}\n\n` +
                      `_Ketik ${usedPrefix}ceksewa <nomor> untuk info detail._`;

        await m.reply(caption.trim());
    }

    // ==========================================
    // LOGIKA: CEK SEWA (DETAIL)
    // ==========================================
    if (isCek) {
        if (!text) throw `⚠️ *Format Salah!*\n\nContoh: *${usedPrefix + command} 1*\n\n_Gunakan *${usedPrefix}listsewa* untuk melihat nomor urut._`;
        if (!/^\d+$/.test(text)) throw "❌ Nomor urut harus berupa angka!";

        let index = parseInt(text) - 1;
        if (index < 0 || index >= sewaList.length) throw "❌ Nomor urut tidak ditemukan di dalam daftar!";

        let chatId = sewaList[index];
        let chatData = global.db.data.chats[chatId];
        let remainingTime = chatData.expired - Date.now();
        let name = await conn.getName(chatId) || 'Grup Tidak Dikenal';
        
        // Konversi timestamp ke format tanggal lokal Indonesia
        let tanggalExpired = new Date(chatData.expired).toLocaleString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let caption = `💎 *DETAIL SEWA GRUP* 💎\n\n` +
                      `> 🏢 *Nama:* ${name}\n` +
                      `> 🆔 *ID Grup:* ${chatId}\n` +
                      `> ⏳ *Sisa Waktu:* ${msToDate(remainingTime)}\n` +
                      `> 📅 *Berakhir:* ${tanggalExpired} WIB`;

        await m.reply(caption.trim());
    }
};

handler.help = ['listsewa', 'ceksewa <nomor>'];
handler.tags = ['owner'];
handler.command = /^(listsewa|ceksewa|csewa)$/i;
handler.owner = true;

module.exports = handler;

// Fungsi waktu yang sudah dirapikan
function msToDate(ms) {
    if (ms <= 0) return 'Expired';
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    let hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    let minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    let res = [];
    if (days > 0) res.push(`${days} Hari`);
    if (hours > 0) res.push(`${hours} Jam`);
    if (minutes > 0) res.push(`${minutes} Menit`);

    return res.length > 0 ? res.join(' ') : '< 1 Menit';
}