const catboxUpload = require('../lib/scrape/catbox') // Sesuaikan path jika berbeda
const crypto = require('crypto');

let handler = async (m, { conn, usedPrefix, command }) => {
    // Identifikasi media yang direply atau dikirim langsung
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    // Validasi input
    if (!mime) {
        return m.reply(`Kirim atau balas media (gambar/video/audio/dokumen) dengan caption *${usedPrefix + command}*`);
    }

    m.reply(global.wait);

    try {
        // Ekstrak buffer menggunakan fungsi download dari smsg Baileys
        let media = await q.download();
        if (!media) throw new Error('Gagal mengunduh media dari pesan WhatsApp.');

        // [PENTING] Ekstrak ekstensi yang benar. Format Baileys biasanya 'image/jpeg' atau 'audio/ogg; codecs=opus'
        let ext = mime.split('/')[1].split(';')[0]; 
        
        // Cek jika file punya nama asli (biasanya dokumen), jika tidak pakai random hex
        let fileName = q.fileName || q.msg?.fileName || `${crypto.randomBytes(6).toString('hex')}.${ext}`;

        // Jalankan scraper (Hidden API / Scraper Bypass)
        let uploadRes = await catboxUpload(media, fileName);
        
        // Kalkulasi ke ukuran Megabytes (MB)
        let sizeMB = (uploadRes.size / 1024 / 1024).toFixed(2);

        // Sajikan data ke user
        let teks = `*🐈 C A T B O X - U P L O A D E R*\n\n`;
        teks += `> 🗂️ *Name:* ${uploadRes.filename}\n`;
        teks += `> 📊 *Size:* ${sizeMB} MB\n`;
        teks += `> 📎 *Ext:* .${ext.toUpperCase()}\n`;
        teks += `> 🔗 *URL:* ${uploadRes.url}`;

        // Kirim hasil
        m.reply(teks);

    } catch (e) {
        console.error(e);
        // Fallback error (User-friendly)
        m.reply(global.eror + `\n\nTerjadi kesalahan saat mengunggah file. Pastikan ukuran file tidak melebihi 200MB.\n\n*Log:* ${e.message || e}`);
    }
}

handler.help = ['upload', 'tourl', 'catbox'];
handler.tags = ['tools'];
handler.command = /^(upload|tourl|catbox)$/i;

// Flag keamanan dan keseimbangan fitur
handler.limit = true;

module.exports = handler;