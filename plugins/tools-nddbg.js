const fs = require('fs')
const path = require('path')
const removebg = require('../lib/scrape/nobg')

let handler = async (m, { conn, usedPrefix, command }) => {
    // 1. Cek apakah ada pesan yang di-reply atau gambar yang dikirim langsung
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    // 2. Validasi Input (Harus Gambar)
    if (!/image/.test(mime)) {
        return m.reply(`Kirim atau reply gambar dengan caption *${usedPrefix + command}*\n\n*Catatan:* Hanya menerima format gambar.`)
    }

    m.reply(global.wait)

    // 3. Buat nama file random untuk file sementara di folder /tmp/
    let ran = `${Math.floor(Math.random() * 100000)}.jpg`
    let tmpPath = path.join(process.cwd(), 'tmp', ran)

    try {
        // 4. Download media dan simpan ke file sementara
        let media = await q.download()
        fs.writeFileSync(tmpPath, media)

        // 5. Eksekusi Scraper
        let resultBuffer = await removebg(tmpPath)

        // 6. Kirim hasil
        let caption = `*====[ REMOVE BACKGROUND ]====*\n\n`
        caption += `Background gambar berhasil dihapus!\n`
        caption += `\n${global.wm}`

        // Mengirim buffer langsung sebagai dokumen image/png
        await conn.sendFile(m.chat, resultBuffer, 'nobg.png', caption, m)

    } catch (e) {
        console.error("NoBG Error:", e)
        m.reply(typeof e === 'string' ? `*Gagal:* ${e}` : global.eror)
    } finally {
        // 7. CLEAUP: Hapus file sementara agar server tidak penuh (mencegah ENOSPC)
        if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath)
        }
    }
}

// Metadata Plugin
handler.help = ['removebg','nobg']
handler.tags = ['tools']
handler.command = /^(removebg|nobg)$/i

// Pembatasan fitur
handler.limit = true // Membutuhkan limit karena memakan proses API eksternal

module.exports = handler