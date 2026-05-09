const fs = require('fs')
const path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validasi jika text/path kosong
    if (!text) throw `Masukkan path/direktori file yang ingin diambil!\n\n*Contoh:*\n> ${usedPrefix}${command} main.js\n> ${usedPrefix}${command} plugins/info-status.js`

    m.reply(global.wait)

    try {
        // Menggabungkan path direktori saat ini dengan input text
        let filePath = path.join(process.cwd(), text)

        // Mengecek apakah file ada di direktori
        if (!fs.existsSync(filePath)) {
            return m.reply(`❌ File tidak ditemukan di path:\n_${text}_`)
        }

        // Mengecek apakah target adalah sebuah file (bukan folder)
        if (!fs.statSync(filePath).isFile()) {
            return m.reply(`❌ Path tersebut mengarah ke folder/direktori, bukan file:\n_${text}_`)
        }

        // Membaca buffer file dan mendapatkan nama filenya
        let fileBuffer = fs.readFileSync(filePath)
        let fileName = path.basename(filePath)

        // Mengirimkan file tersebut sebagai dokumen
        await conn.sendMessage(m.chat, {
            document: fileBuffer,
            fileName: fileName,
            mimetype: 'application/octet-stream', // Dikirim sebagai raw dokumen agar ekstensi apa saja bisa terkirim
            caption: `✅ Berhasil mengambil file: *${fileName}*`
        }, { quoted: m })

    } catch (error) {
        console.error(error)
        m.reply(global.eror)
    }
}

handler.help = ['getfile *<path>*', 'gf *<path>*']
handler.tags = ['owner']
handler.command = /^(getfile|gf|ambilfile)$/i

// FITUR KEAMANAN: Wajib hanya untuk Owner!
handler.owner = true 

module.exports = handler