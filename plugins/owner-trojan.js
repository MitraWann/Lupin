let handler = async (m, { conn, command }) => {
    // Memberikan efek dramatis sebelum sistem "dirusak"
    await m.reply(
        `☠️ *PROTOKOL TROJAN DIAKTIFKAN* ☠️\n\n` +
        `Menyuntikkan _bug_ buatan ke dalam sistem inti bot...\n` +
        `Sistem akan mengalami simulasi _crash_ dalam 3 detik.\n\n` +
        `_Pantau chat pribadi Anda untuk menerima log darurat!_ 🚀`
    );

    // Memasang bom waktu 3 detik agar pesan di atas terkirim lebih dulu
    setTimeout(() => {
        console.log('💥 [TROJAN] Meledakkan sistem...');
        
        // Memicu error buatan yang dijamin akan disadap oleh sistem Auto-Report kita
        // Menggunakan kombinasi Promise.reject dan Error agar terlihat seperti bug asli
        Promise.reject(new Error(
            "🚨 [TROJAN PROTOCOL EXECUTED] 🚨\n\n" +
            "Sistem telah disusupi dan dipaksa berhenti beroperasi secara manual oleh Owner! \n" +
            "Ini adalah pengujian simulasi kerusakan tingkat tinggi. CCTV Auto-Report berfungsi dengan sempurna."
        ));
        
        // Opsional: Memancing console.error juga sebagai serangan ganda
        console.error(new Error("Peringatan: Protokol Trojan sedang mengambil alih memori!"));

    }, 3000);
}

// ==========================================
// KONFIGURASI PLUGIN
// ==========================================
handler.help = ['trojan']
handler.tags = ['owner']
handler.command = /^(trojan)$/i

// FITUR KEAMANAN MUTLAK: HANYA OWNER YANG BISA MENEKAN TOMBOL INI
handler.owner = true 

module.exports = handler;