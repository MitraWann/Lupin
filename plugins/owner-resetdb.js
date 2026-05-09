let handler = async (m, { conn, usedPrefix, command }) => {
    // 1. Verifikasi ganda: Karena ini perintah berbahaya, kita minta konfirmasi tambahan
    // Jika hanya mengetik .resetdb tanpa argumen "yakin", bot akan memperingatkan.
    if (!m.text.includes('yakin')) {
        return m.reply(`⚠️ PERINGATAN KERAS! ⚠️\n\nPerintah ini akan menghapus SELURUH data di database (User, Chat, Stats, dll) tanpa terkecuali.\n\nJika Anda benar-benar yakin, ketik:\n*${usedPrefix}${command} yakin*`);
    }
    try {
        // 2. Mengosongkan data di memori RAM
        // Kita kembalikan ke struktur awal bot sesuai yang ada di main.js
        global.db.data = {
            users: {},
            chats: {},
            stats: {},
            msgs: {},
            sticker: {},
            settings: {}
        };
        // 3. Memaksa bot untuk menulis (save) perubahan ke file database.json saat ini juga
        if (global.db.write) await global.db.write();
        else if (global.db.save) await global.db.save();
        m.reply('✅ *DATABASE BERHASIL DIRESET!*\n\nSemua data telah dihapus dan database kini dalam kondisi bersih seperti baru.');
        
    } catch (e) {
        console.error(e);
        m.reply(`❌ Terjadi kesalahan saat mereset database: ${e.message}`);
    }
}
handler.help = ['resetdb yakin'];
handler.tags = ['owner'];
handler.command = /^(resetdb|resetdatabase)$/i;
// Mengunci perintah agar hanya Owner Utama yang bisa menggunakan
handler.rowner = true; 
module.exports = handler;