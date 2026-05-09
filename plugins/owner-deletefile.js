const fs = require('fs')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `Masukkan lokasi file yang ingin Anda hapus secara permanen.\n\n` +
            `*Contoh Penggunaan:*\n` +
            `> ${usedPrefix + command} plugins/fitur-sampah.js`
        )
    }

    try {
        let filePath = text.trim()

        if (!fs.existsSync(filePath)) {
            return m.reply(`⛔ *File Tidak Ditemukan!*\n\nFile \`${filePath}\` sudah tidak ada di sistem.`)
        }

        // Eksekusi penghapusan file
        fs.unlinkSync(filePath)

        let suksesMsg = `🗑️ *FILE BERHASIL DIHAPUS* 🗑️\n\n` +
                        `> 📂 *Target:* \`${filePath}\`\n\n` +
                        `_File telah dilenyapkan dari sistem secara permanen._`

        m.reply(suksesMsg)

    } catch (e) {
        console.error(e)
        m.reply(`❌ *Gagal menghapus file!*\n\n\`${e.message}\``)
    }
}

handler.help = ['deletefile <path>']
handler.tags = ['owner']
handler.command = /^(df|deletefile|hapusfile)$/i
handler.rowner = true // Mutlak hanya untuk Boss

module.exports = handler