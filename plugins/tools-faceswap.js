const faceswap = require('../lib/scrape/faceswap');

let handler = async (m, { conn, usedPrefix, command }) => {
    // Mengecek apakah ada pesan yang di-reply (gambar target)
    let q = m.quoted ? m.quoted : m;
    
    if (!m.quoted) {
        return m.reply(`*Cara Penggunaan:*\n\n1. Kirim/unggah gambar target (tubuh/background).\n2. Balas gambar target tersebut dengan mengirim gambar sumber (wajah) beserta caption *${usedPrefix + command}*.`);
    }

    // Mendapatkan tipe mime dari pesan yang dikirim dan yang di-reply
    let mimeQuoted = (m.quoted.msg || m.quoted).mimetype || '';
    let mimeMe = (m.msg || m).mimetype || '';

    // Validasi apakah keduanya benar-benar gambar
    if (!/image/.test(mimeQuoted) || !/image/.test(mimeMe)) {
        return m.reply(`Kedua media harus berupa gambar!\n\nPastikan kamu mengirim gambar wajah sambil membalas gambar target.`);
    }

    // Memunculkan pesan tunggu menggunakan config global bot
    m.reply(global.wait);

    try {
        // Mengunduh Buffer dari gambar yang dikirim (Sumber Wajah)
        let sourceBuffer = await m.download();
        
        // Mengunduh Buffer dari gambar yang di-reply (Target Tubuh)
        let targetBuffer = await m.quoted.download();

        // Eksekusi API via Wrapper
        let result = await faceswap(sourceBuffer, targetBuffer);

        if (result && result.image) {
            // Mengirim balik hasil gambar ke chat pengguna
            await conn.sendFile(m.chat, result.image, 'faceswap_result.jpg', '✨ Selesai! Ini dia hasil faceswap-nya.', m);
        } else {
            m.reply(global.eror);
        }
    } catch (e) {
        console.error(e);
        m.reply(`Terjadi kesalahan sistem saat memproses gambar atau API sedang down.\n\nDetail: ${e.message || e}`);
    }
}

handler.help = ['faceswap'];
handler.tags = ['tools'];
handler.command = /^(faceswap)$/i;

// Mengamankan fitur (mengurangi limit) karena memakan resources yang cukup tinggi
handler.limit = true;

module.exports = handler;