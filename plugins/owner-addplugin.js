let fs = require('fs')
let path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Memisahkan nama file dan isi kodenya
    let args = text.split(' ')
    let filename = args[0]
    
    if (!filename) return m.reply(`⚠️ Masukkan nama file plugin yang ingin dibuat!\n\n*Cara Penggunaan:*\n1. Balas (reply) pesan yang berisi kode dengan perintah: *${usedPrefix + command} namafile.js*\n2. Atau ketik langsung: *${usedPrefix + command} namafile.js <isi kodenya>*`)

    // Membersihkan ekstensi
    if (!filename.endsWith('.js')) filename += '.js'

    // 🛡️ KEAMANAN: Mencegah Directory Traversal (Hack folder)
    if (filename.includes('/') || filename.includes('\\')) {
        return m.reply(`⛔ *Akses Ditolak!*\nDilarang menggunakan karakter path ( / atau \\ ) untuk keamanan server.`)
    }

    // Mengambil kode plugin (Bisa dari pesan yang di-reply, atau dari teks setelah nama file)
    let pluginCode = m.quoted ? m.quoted.text : args.slice(1).join(' ')
    
    if (!pluginCode) {
        return m.reply(`⚠️ Kodenya kosong, Boss!\nSilakan reply pesan yang berisi kode JavaScript, atau ketik langsung kodenya di sebelah nama file.`)
    }

    // Menentukan lokasi penyimpanan di folder plugins
    let filePath = path.join(process.cwd(), 'plugins', filename)

    // Opsional: Peringatan jika menimpa file yang sudah ada
    let isOverwrite = fs.existsSync(filePath)

    try {
        // Proses menulis/membuat file
        fs.writeFileSync(filePath, pluginCode)
        
        let pesan = `✅ *PLUGIN BERHASIL DIBUAT!*\n\n`
        pesan += `📁 *Nama File:* \`${filename}\`\n`
        pesan += `📊 *Status:* ${isOverwrite ? 'Menimpa file lama (Update)' : 'File baru dibuat'}\n\n`
        pesan += `_Catatan: Bot biasanya akan otomatis memuat (auto-reload) file ini. Jika fitur belum muncul, silakan Restart bot dari panel._`
        
        m.reply(pesan)
    } catch (e) {
        console.error(e)
        m.reply(`❌ *GAGAL MENYIMPAN PLUGIN!*\nTerjadi kesalahan pada sistem saat mencoba menulis file.`)
    }
}

handler.help = ['addplugin <nama> <kode>']
handler.tags = ['owner']
handler.command = /^(addplugin|svplugin|saveplugin|ap)$/i
handler.owner = true // MUTLAK: Hanya Boss (Owner) yang bisa mencipta!

module.exports = handler