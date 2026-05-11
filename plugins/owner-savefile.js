const fs = require('fs')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Peringatan jika lokasi file tidak diisi
    if (!text) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `Silakan masukkan lokasi dan nama file tujuan.\n\n` +
            `*Contoh Penggunaan:*\n` +
            `> ${usedPrefix + command} plugins/fitur-baru.js`
        )
    }

    // 2. Peringatan jika Boss lupa membalas (reply) pesan teksnya
    if (!m.quoted || !m.quoted.text) {
        return m.reply(
            `⚠️ *Aksi Ditolak!*\n\n` +
            `Anda harus membalas (reply) pesan yang berisi teks script/kode untuk disimpan ke dalam file.`
        )
    }

    try {
        let filePath = `${text.trim()}`
        
        // Eksekusi penyimpanan file
        fs.writeFileSync(filePath, m.quoted.text)
        
        // Mengkalkulasi ukuran file yang baru saja disimpan
        let size = Buffer.byteLength(m.quoted.text, 'utf8')
        let sizeFormatted = size > 1024 ? (size / 1024).toFixed(2) + ' KB' : size + ' Bytes'

        // 3. Output sukses yang estetik dan informatif
        let suksesMsg = `✅ *FILE DISIMPAN* ✅\n\n` +
                        `> 📂 *Lokasi:* \`${filePath}\`\n` +
                        `> 📏 *Ukuran:* ${sizeFormatted}\n\n` +
                        `_Sistem telah diperbarui secara otomatis._`

        await conn.sendMessage(m.chat, { text: suksesMsg }, { quoted: m })

    } catch (e) {
        console.error(e)
        // 4. Output jika terjadi error (misal: folder tidak ditemukan)
        m.reply(`❌ *Gagal Menyimpan File!*\n\nPastikan nama folder benar. Detail Error:\n\`${e.message}\``)
    }
}

handler.help = ['savefile <path>']
handler.tags = ['owner']
handler.command = /^(sf|savefile|simpanfile)$/i

handler.rowner = true

module.exports = handler