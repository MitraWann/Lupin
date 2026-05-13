// plugins/thumb.js
const sharp = require('sharp');
const fs = require('fs');
const { Button } = require('../lib/MessageBuilder.js'); // sesuaikan path jika berbeda

// Ukuran yang diizinkan dan default
const ALLOWED_SIZES = { 48: true, 128: true, 256: true };
const DEFAULT_SIZE = 256;

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // Tentukan ukuran
    let size = DEFAULT_SIZE;
    if (args.length > 0) {
        let parsed = parseInt(args[0]);
        if (!ALLOWED_SIZES[parsed]) {
            return conn.reply(m.chat, `❌ Ukuran tidak valid. Gunakan:\n• *${usedPrefix}${command} 48*\n• *${usedPrefix}${command} 128*\n• *${usedPrefix}${command} 256*`, m);
        }
        size = parsed;
    }

    // Validasi quoted
    if (!m.quoted) return conn.reply(m.chat, '⚠️ Reply gambar dengan perintah *.thumb*', m);
    let q = m.quoted;
    if (q.mtype !== 'imageMessage' && q.mtype !== 'stickerMessage') {
        return conn.reply(m.chat, '❌ Pesan yang di-reply bukan gambar/stiker!', m);
    }

    let filename;
    try {
        // Unduh gambar
        filename = await conn.downloadAndSaveMediaMessage(q);
        let imageBuffer = fs.readFileSync(filename);

        // Buat thumbnail
        let thumbnailBuffer = await sharp(imageBuffer)
            .resize(size, size, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        let base64Thumbnail = thumbnailBuffer.toString('base64');
        let sizeKB = (thumbnailBuffer.length / 1024).toFixed(1);

        // 1. Kirim preview gambar
        await conn.sendMessage(m.chat, {
            image: thumbnailBuffer,
            caption: `✅ *Thumbnail ${size}×${size}*\n📦 Ukuran: ${sizeKB} KB`,
        }, { quoted: m });

        // 2. Kirim file JSON
        let jsonPayload = JSON.stringify({
            thumbnail: {
                size: `${size}x${size}`,
                fileSizeKB: sizeKB,
                jpegThumbnail: base64Thumbnail
            }
        }, null, 2);
        await conn.sendMessage(m.chat, {
            document: Buffer.from(jsonPayload),
            fileName: `jpegThumbnail_${size}x${size}.json`,
            mimetype: 'application/json'
        }, { quoted: m });

        // 3. Kirim tombol salin (copy)
        let btn = new Button();
        btn.setBody(`📋 Salin nilai jpegThumbnail ${size}×${size}`)
           .addCopy('📝 Salin base64', base64Thumbnail, `thumb_${size}`);
        await btn.run(m.chat, conn, m);

    } catch (err) {
        console.error(err);
        conn.reply(m.chat, '❌ Error: ' + err.message, m);
    } finally {
        if (filename) {
            try { fs.unlinkSync(filename); } catch (e) {}
        }
    }
};

handler.help = ['thumb 48', 'thumb 128', 'thumb 256'];
handler.tags = ['tools'];
handler.command = /^thumb(?:\s+(\d+))?$/i;

module.exports = handler;