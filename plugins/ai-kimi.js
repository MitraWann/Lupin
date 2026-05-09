const { kimiai, listChats } = require('../lib/scraper-kimi');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validasi Input
    if (!text) return m.reply(`Masukkan pertanyaan!\n\n*Contoh:* ${usedPrefix + command} jelaskan apa itu quantum computing.`);

    // 2. Pesan Loading
    m.reply(global.wait || '*_Tunggu sedang di proses..._*');

    try {
        // 3. Ambil Sesi Terakhir Langsung dari Server Kimi AI
        let history = await listChats(1); // Ambil 1 ruang obrolan paling atas
        let activeChatId = null;

        if (history && history.items && history.items.length > 0) {
            activeChatId = history.items[0].id;
        }

        // 4. Eksekusi API
        let res = await kimiai(text, activeChatId);
        
        // Validasi hasil
        if (!res || !res.text) throw new Error('Gagal mendapatkan balasan dari Kimi AI.');

        // 5. Kirim Balasan (Hanya teks)
        await conn.sendMessage(m.chat, { 
            text: res.text 
        }, { quoted: m });

    } catch (error) {
        console.error('[KIMI_AI_ERROR]', error);
        
        // Custom error interceptor
        if (String(error).includes('belum diisi')) {
            return m.reply(`[!] SISTEM ERROR\nCookie/Token Auth Kimi AI belum di-setup oleh Owner/Developer di dalam file *lib/scraper-kimi.js*.`);
        }

        m.reply((global.eror || '_*Server Error*_') + '\n\n' + String(error.message || error));
    }
}

handler.help = ['kimi <teks>', 'kimiai <teks>'];
handler.tags = ['ai'];
handler.command = /^(kimi|kimiai)$/i;

// Flag Keamanan dan Ekonomi
handler.limit = true; // Mengurangi limit user setiap kali AI merespon
handler.premium = false;

module.exports = handler;