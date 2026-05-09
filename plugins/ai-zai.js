const { chatZai } = require('../lib/zai.js'); // Sesuaikan path library jika berbeda

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validasi Input User
    if (!text) {
        return m.reply(`Harap masukkan pertanyaan atau perintah!\n\n*Contoh:*\n${usedPrefix + command} Apa itu black hole?`);
    }

    // 2. Feedback Proses Berjalan (Mengambil dari global.wait config.js Anda)
    await m.reply(global.wait);

    try {
        // 3. Eksekusi Web Scraping / API AI
        const res = await chatZai(text);

        // 4. Validasi Jika Gagal Fetch
        if (!res.status) {
            throw new Error(res.message || "Gagal mendapatkan respon dari server Z.ai");
        }

        // 5. Formatting Output agar enak dilihat di WhatsApp
        let resultText = '';
        
        // Memasukkan logika 'Thinking/Reasoning' jika model GLM-5 melakukan proses berpikir
        if (res.thinking) {
            resultText += `*[ 🤔 Thinking ]*\n_${res.thinking.trim()}_\n\n`;
        }
        
        // Memasukkan hasil jawaban utama
        resultText += `*[ 🤖 GLM-5 Answer ]*\n${res.answer.trim()}`;

        // 6. Mengirim Respon ke User
        await m.reply(resultText);

    } catch (e) {
        // 7. Error Handling Fallback (Mengambil global.eror)
        console.error(`[Error Plugin ZAI]:`, e);
        m.reply(global.eror + `\n\n_Detail: ${e.message}_`);
    }
}

// Konfigurasi Standar Plugin
handler.help = ['zai', 'glm5']
handler.tags = ['ai']
handler.command = /^(zai|glm5)$/i

// Flag Keamanan & Ekonomi Bot
handler.limit = true // Memotong limit user sesuai handler.js 

module.exports = handler