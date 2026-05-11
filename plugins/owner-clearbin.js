const fs = require('fs')
const path = require('path')

let handler = async (m, { conn, usedPrefix, command }) => {
    // Menentukan target folder khusus '.RecycleBin'
    let targetFolder = '.RecycleBin'
    let targetPath = path.resolve(targetFolder)

    // Pengecekan apakah folder eksis
    if (!fs.existsSync(targetPath)) {
        return m.reply(`❌ Folder \`${targetFolder}\` tidak ditemukan di dalam direktori bot.`)
    }

    const statDir = fs.statSync(targetPath)
    if (!statDir.isDirectory()) {
        return m.reply(`❌ Target \`${targetFolder}\` adalah sebuah file, bukan folder! Gunakan perintah hapus file untuk ini.`)
    }

    // Memunculkan pesan loading
    m.reply(global.wait || '_*Tunggu sedang di proses...*_')

    try {
        // Membaca isi dari folder target
        let files = fs.readdirSync(targetPath)
        
        if (files.length === 0) {
            return m.reply(`✅ Folder \`${targetFolder}\` sudah dalam keadaan bersih/kosong!`)
        }

        let deletedCount = 0
        let failedCount = 0

        // Looping untuk menghapus semua isi di dalam folder target
        for (let file of files) {
            let filePath = path.join(targetPath, file)
            try {
                // Menghapus file/folder secara paksa dan rekursif
                fs.rmSync(filePath, { recursive: true, force: true })
                deletedCount++
            } catch (e) {
                console.error(`Gagal menghapus ${filePath}:`, e)
                failedCount++
            }
        }

        // Menyusun laporan hasil eksekusi
        let replyMsg = `🗑️ *PEMBERSIHAN SELESAI*\n\n`
        replyMsg += `📍 *Folder:* \`${targetFolder}\`\n`
        replyMsg += `✅ *Berhasil dihapus:* ${deletedCount} item\n`
        if (failedCount > 0) {
            replyMsg += `❌ *Gagal dihapus:* ${failedCount} item (Mungkin sedang digunakan oleh proses lain)\n`
        }

        m.reply(replyMsg)

    } catch (error) {
        console.error(error)
        m.reply(global.eror || '_*Server Error*_')
    }
}

handler.help = ['clearbin']
handler.tags = ['owner']
handler.command = /^(clearbin)$/i

// Flag Keamanan Wajib
handler.owner = true // HANYA BISA DIAKSES OLEH OWNER

module.exports = handler