const novaAi = require('../lib/novaAi');
const util = require('util');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validasi input
    if (!text) {
        return m.reply(`Masukkan pertanyaan!\n\n*Contoh:* ${usedPrefix + command} Siapa penemu lampu?`);
    }

    // Memunculkan pesan loading
    //m.reply(global.wait);

    try {
        // Memanggil API melalui library scraper
        const res = await novaAi(text);
        
        // Ekstraksi jawaban cerdas
        // Karena struktur pasti JSON tidak diketahui, kita cari key yang umum digunakan oleh AI
        let answer = res.response_text || res.answer || res.text || res.reply || res.message || res.response;

        // Jika tidak ada key di atas yang cocok, jadikan format string agar tetap bisa dibaca
        if (!answer) {
            answer = typeof res === 'string' ? res : util.format(res);
        }

        // Kirim balasan ke user
        await m.reply(answer.trim());

    } catch (e) {
        console.error(e);
        m.reply(`*Terjadi Kesalahan!*\n\nSistem AI mungkin sedang sibuk atau endpoint API mengalami perubahan.\n\n*Log:* ${util.format(e)}`);
    }
}

handler.help = ['nova', 'novaai'].map(v => v + ' <teks>');
handler.tags = ['ai'];
handler.command = /^(nova|novaai)$/i;

// Mengurangi limit user karena ini menggunakan request jaringan ke AI
handler.limit = true;

module.exports = handler;