/**
 * PLUGIN AI CLAUDE (DEEPAI WRAPPER)
 * Location: ./plugins/ai-claude.js
 */

const { chat, clearSession } = require('../lib/scraper-deepai');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validasi input kosong
    if (!text) {
        let msg = `*Format salah!*\n\n`;
        msg += `Contoh penggunaan:\n*${usedPrefix}${command}* Halo, tolong buatkan pantun dong!\n\n`;
        msg += `💡 *Tips:* Ketik *${usedPrefix}${command} clear* untuk mereset ingatan AI terhadap percakapan Anda.`;
        return m.reply(msg);
    }

    // Fitur Reset Memori Percakapan
    if (text.toLowerCase() === 'clear') {
        clearSession(m.sender);
        return m.reply('✅ _Berhasil! Riwayat percakapan Anda dengan AI telah direset._');
    }

    // Kirim indikator loading
    //await m.reply(global.wait || '⏳ _Sedang memproses..._');

    try {
        // Panggil fungsi scraper, gunakan m.sender sebagai ID unik sesi per-user
        let result = await chat(m.sender, text);
        
        // Kirim hasil ke pengguna
        await m.reply(result);
        
    } catch (e) {
        console.error('[DeepAI Plugin Error]:', e);
        m.reply(global.eror || '❌ _Terjadi kesalahan saat memproses permintaan dari server AI._');
    }
}

// Konfigurasi metadata plugin
handler.help = ['claude'].map(v => v + ' <teks>');
handler.tags = ['ai'];
handler.command = /^(claude|deepai)$/i;
handler.limit = true; // Mengurangi limit pengguna agar tidak disalahgunakan untuk spam

module.exports = handler;