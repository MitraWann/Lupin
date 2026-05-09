let fs = require('fs')
let path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`⚠️ Masukkan nama file plugin yang ingin dieksekusi mati!\n\nContoh penggunaan:\n*${usedPrefix + command} menu*\n*${usedPrefix + command} owner-searchfitur.js*`)

    // Membersihkan input
    let filename = text.trim()
    if (!filename.endsWith('.js')) filename += '.js'

    // 🛡️ KEAMANAN TINGKAT TINGGI: Mencegah Directory Traversal (Hack)
    // Memastikan user tidak mengetik "../main.js" untuk menghapus file inti
    if (filename.includes('/') || filename.includes('\\')) {
        return m.reply(`⛔ *Akses Ditolak!*\nSebutkan saja nama filenya, dilarang menggunakan karakter path ( / atau \\ ).`)
    }

    // Menentukan lokasi pasti file tersebut
    let filePath = path.join(process.cwd(), 'plugins', filename)

    // Mengecek apakah file tersebut benar-benar ada
    if (!fs.existsSync(filePath)) {
        return m.reply(`🔍 File *\`${filename}\`* tidak ditemukan di dalam folder plugins.\n\nGunakan perintah *${usedPrefix}searchfile* untuk memastikan nama filenya.`)
    }

    try {
        // Eksekusi mati (Menghapus file secara permanen)
        fs.unlinkSync(filePath)
        
        m.reply(`✅ *EKSEKUSI BERHASIL!*\n\nFile plugin *\`${filename}\`* telah dimusnahkan dari server selamanya.`)
    } catch (e) {
        console.error(e)
        m.reply(`❌ *GAGAL MENGHAPUS FILE!*\nTerjadi kesalahan pada sistem. Pastikan bot memiliki izin akses (permission) untuk menghapus file.`)
    }
}

handler.help = ['delplugin <nama_file>', 'hapusplugin <nama_file>']
handler.tags = ['owner']
handler.command = /^(delplugin|hapusplugin|deleteplugin|dp)$/i
handler.owner = true // MUTLAK: Hanya Boss (Owner) yang bisa pakai pedang ini!

module.exports = handler