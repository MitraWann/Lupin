/**
 * ALBUM ART SEARCHER (HD QUALITY)
 * Location: ./plugins/tools-albumart.js
 * Feature: Mencari cover album musik HD berdasarkan judul lagu/album.
 */

const fetch = require('node-fetch');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*Format salah!*\n\nContoh: ${usedPrefix + command} After Hours Weeknd`);
    
    await m.reply(global.wait); // Menggunakan variabel global loading kamu

    try {
        // Menggunakan iTunes API untuk mendapatkan metadata musik & artwork original (High Res)
        let url = `https://itunes.apple.com/search?term=${encodeURIComponent(text)}&entity=song&limit=1`;
        let response = await fetch(url);
        let json = await response.json();

        if (!json.results || json.results.length === 0) {
            return m.reply(`❌ Cover album untuk *"${text}"* tidak ditemukan.`);
        }

        let data = json.results[0];
        
        // Manipulasi URL untuk mendapatkan resolusi HD (iTunes default memberikan 100x100)
        // Kita ubah menjadi 1400x1400 untuk kualitas HD murni
        let hdArtwork = data.artworkUrl100.replace('100x100bb.jpg', '1400x1400bb.jpg');

        let caption = `🖼️ *ALBUM ART FOUND*\n\n`;
        caption += `🎵 *Judul:* ${data.trackName}\n`;
        caption += `👤 *Artis:* ${data.artistName}\n`;
        caption += `💿 *Album:* ${data.collectionName}\n`;
        caption += `📅 *Rilis:* ${data.releaseDate.split('T')[0]}\n`;
        caption += `📂 *Genre:* ${data.primaryGenreName}\n\n`;
        caption += `> *TulipNex Multimedia Interface*`;

        // Kirim gambar sebagai file agar kualitas tidak pecah (HD)
        await conn.sendFile(m.chat, hdArtwork, 'albumart.jpg', caption, m);

    } catch (e) {
        console.error(e);
        m.reply(global.eror); // Menggunakan variabel global error kamu
    }
};

handler.help = ['albumart <judul lagu>'];
handler.tags = ['tools', 'internet'];
handler.command = /^(albumart|cover|art|album)$/i;

// Tambahkan limit jika ingin dikaitkan dengan ekonomi bot
handler.limit = true;

module.exports = handler;