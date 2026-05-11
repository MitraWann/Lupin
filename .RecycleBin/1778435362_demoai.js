const { createTextSubmessage, createInlineImageSubmessage, createAIRichResponseMessage } = require('../lib/airich');

let handler = async (m, { conn, text, usedPrefix, command, args, isOwner, isAdmin, isPrems }) => {
    try {
        // Memunculkan pesan loading dari variabel global
        if (global.wait) m.reply(global.wait);

        if (command === 'airich') {
            // ═════════════════════════════════════════════
            // DEMO: Gambar Sederhana dengan Caption
            // ═════════════════════════════════════════════
            const submessages = [
                createTextSubmessage('📸 *Contoh Gambar dengan AI Rich Response*\n\nIni adalah demo penggunaan inline image:'),
                createInlineImageSubmessage(
                    'https://via.placeholder.com/200/FF6B6B',
                    'https://via.placeholder.com/800/FF6B6B',
                    'https://example.com/demo',
                    'Gambar Demo',
                    2, // CENTER
                    'https://example.com/detail'
                ),
                createTextSubmessage('\n✨ Klik gambar untuk membuka detail!'),
            ];

            const message = createAIRichResponseMessage(submessages);
            
            // Mengirim pesan dengan quoted message (m) agar rapi
            await conn.sendMessage(m.chat, message, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } else if (command === 'galeriwarna') {
            // ═════════════════════════════════════════════
            // DEMO: Multiple Images
            // ═════════════════════════════════════════════
            const warna = [
                {
                    nama: '🔴 Merah',
                    preview: 'https://via.placeholder.com/200/FF0000',
                    highres: 'https://via.placeholder.com/800/FF0000',
                    url: 'https://example.com/warna/merah',
                },
                {
                    nama: '🟢 Hijau',
                    preview: 'https://via.placeholder.com/200/00FF00',
                    highres: 'https://via.placeholder.com/800/00FF00',
                    url: 'https://example.com/warna/hijau',
                },
                {
                    nama: '🔵 Biru',
                    preview: 'https://via.placeholder.com/200/0000FF',
                    highres: 'https://via.placeholder.com/800/0000FF',
                    url: 'https://example.com/warna/biru',
                },
            ];

            let submessages = [
                createTextSubmessage('🎨 *GALERI WARNA*\n\nPilih warna favorit Anda:\n'),
            ];

            // Looping data warna untuk dimasukkan ke dalam submessages
            warna.forEach((w, idx) => {
                submessages.push(
                    createTextSubmessage(`\n*${idx + 1}. ${w.nama}*`)
                );
                submessages.push(
                    createInlineImageSubmessage(
                        w.preview,
                        w.highres,
                        w.url,
                        w.nama,
                        2,
                        w.url
                    )
                );
            });

            const message = createAIRichResponseMessage(submessages);
            await conn.sendMessage(m.chat, message, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        }
    } catch (error) {
        console.error('Error on airich plugin:', error);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        // Fallback ke pesan error sistem
        m.reply(global.eror || '_*Terjadi kesalahan sistem saat memproses AI Rich Response.*_');
    }
};

// Konfigurasi Meta Plugin
handler.help = ['airich', 'galeriwarna'];
handler.tags = ['fun'];
handler.command = /^(airich|galeriwarna)$/i;

// Flag Keamanan
handler.limit = true; // Mengurangi limit user karena menggunakan fitur rich response
handler.group = false; // Bisa digunakan di PC maupun GC

module.exports = handler;