const perplexityScraper = require('../lib/perplexity');

let handler = async (m, { conn, text, usedPrefix, command, args, isOwner, isAdmin, isPrems }) => {
    // 1. Validasi Input User
    if (!text) {
        return m.reply(`Masukkan pertanyaan!\n\n*Contoh:* ${usedPrefix + command} siapakah presiden ri tahun 2024?`);
    }

    // 2. Respon Loading / Tunggu
    m.reply(global.wait);

    try {
        // 3. Eksekusi Scraper & Hit API
        const result = await perplexityScraper(text);

        // 4. Validasi Output
        if (result && result.success && result.answer) {
            // Membersihkan elemen teks khas AI
            let cleanText = result.answer
                .replace(/\*\*/g, '*') // 1. Mengubah double asterisk (**) menjadi single asterisk (*)
                .replace(/###/g, '')   // 2. Menghapus simbol hash (###)
                .replace(/\[\d+(?:,\s*\d+)*\]/g, '') // 3. Menghapus kutipan angka seperti [1], [2], [1, 2]
                .trim();

            // Mengirimkan hasil format bersih ke user tanpa thumbnail
            await conn.sendMessage(m.chat, {
                text: `${cleanText}`
            }, { quoted: m });
        } else {
            // Error handling jika tidak dapat jawaban / request diblock oleh WAF
            m.reply(`Maaf, gagal mendapatkan jawaban dari API. Silakan coba lagi nanti.\n\n${global.eror}`);
        }

    } catch (error) {
        // 5. Fatal Error Handling
        console.error('[Perplexity Error]:', error);
        m.reply(global.eror);
    }
}

// Konfigurasi Command & Meta Data Baileys
handler.help = ['perplexity <teks>'];
handler.tags = ['ai'];
handler.command = /^(perplexity|pplx)$/i;

// Mengatur flag keamanan & ekonomi (bot style)
handler.limit = true; // Mengurangi limit karena fitur ini resource-heavy
handler.register = true; // Memastikan hanya user terdaftar yang bisa menggunakan

module.exports = handler;