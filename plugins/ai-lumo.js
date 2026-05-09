const { LumoClient } = require('../lib/lumo');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validasi input
    if (!text) return m.reply(`Masukkan pertanyaan yang ingin diajukan ke Lumo AI!\n\n*Contoh:* ${usedPrefix + command} Halo, siapa kamu?`);
    
    // Memberikan respon indikator loading kepada user menggunakan react emoji
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    try {
        // Menginisialisasi modul client dari scraper Lumo
        const client = new LumoClient();
        
        // Meminta guest session & token untuk request ke Lumo Proton
        await client.initGuestSession();
        
        // Modifikasi prompt (Prompt Injection) untuk mencegah penggunaan tabel
        const promptInject = text + "\n\n[Instruksi Sistem: JANGAN pernah menggunakan format tabel markdown dalam jawabanmu. Jika kamu perlu menyajikan data berkolom/tabular, ubah bentuknya menjadi format daftar (list bullet/angka) biasa agar rapi dan mudah dibaca di aplikasi chat mobile.]";

        // Mengeksekusi pesan melalui algoritma Enkripsi yang direverse
        const response = await client.sendMessage(promptInject);

        // Mengambil teks jawaban bersih
        let txt = response.message.trim();
        
        // Membersihkan format khas AI: 
        // 1. Mengubah double asterisk (**) menjadi single asterisk (*)
        // 2. Menghapus semua tanda pagar (#)
        txt = txt.replace(/\*\*/g, '*').replace(/#/g, '');

        // Mengirimkan hasil (opsional: tambahkan react selesai jika mau)
        // await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });

    } catch (error) {
        console.error('[LUMO AI ERROR]:', error);
        // Menggunakan standar penanganan error dari bot
        m.reply(global.eror);
    }
}

// Konfigurasi Standar Plugin
handler.help = ['lumo <pertanyaan>']
handler.tags = ['ai']
handler.command = /^(lumo)$/i

// Keamanan/Keseimbangan Fitur
handler.limit = true // Mengkonsumsi limit user karena pemrosesan API ini cukup berat
handler.register = false // Opsional: Memastikan hanya user terdaftar yang dapat menggunakan

module.exports = handler;