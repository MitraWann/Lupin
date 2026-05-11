let fs = require('fs')
let path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Memisahkan nama file dan isi kodenya
    let args = text.split(' ')
    let filename = args[0]
    
    if (!filename) return m.reply(`⚠️ Masukkan nama file scraper/library yang ingin dibuat!\n\n*Cara Penggunaan:*\n1. Balas (reply) pesan yang berisi kode dengan perintah: *${usedPrefix + command} namascraper.js*\n2. Atau ketik langsung: *${usedPrefix + command} namascraper.js <isi kodenya>*`)

    // Membersihkan ekstensi
    if (!filename.endsWith('.js')) filename += '.js'

    // 🛡️ KEAMANAN: Mencegah Directory Traversal (Hack folder)
    if (filename.includes('/') || filename.includes('\\')) {
        return m.reply(`⛔ *Akses Ditolak!*\nDilarang menggunakan karakter path ( / atau \\ ) untuk keamanan server.`)
    }

    // Mengambil kode scraper (Bisa dari pesan yang di-reply, atau dari teks setelah nama file)
    let scraperCode = m.quoted ? m.quoted.text : args.slice(1).join(' ')
    
    if (!scraperCode) {
        return m.reply(`⚠️ Kodenya kosong!\nSilakan reply pesan yang berisi kode JavaScript scraper, atau ketik langsung kodenya di sebelah nama file.`)
    }

    // Memastikan folder 'lib' ada, jika tidak, buat otomatis
    let libDir = path.join(process.cwd(), 'lib')
    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true })
    }

    // Menentukan lokasi penyimpanan di folder lib
    let filePath = path.join(libDir, filename)

    // Peringatan jika menimpa file yang sudah ada
    let isOverwrite = fs.existsSync(filePath)

    try {
        // Proses menulis/membuat file
        fs.writeFileSync(filePath, scraperCode)
        
        let pesan = `✅ *SCRAPER BERHASIL DIBUAT!*\n\n`
        pesan += `📁 *Lokasi File:* \`lib/${filename}\`\n`
        pesan += `📊 *Status:* ${isOverwrite ? 'Menimpa file lama (Update)' : 'File baru dibuat'}`
        
        m.reply(pesan)
    } catch (e) {
        console.error(e)
        m.reply(`❌ *GAGAL MENYIMPAN SCRAPER!*\nTerjadi kesalahan pada sistem saat mencoba menulis file.`)
    }
}

handler.help = ['addscrape <nama> <kode>']
handler.tags = ['owner']
handler.command = /^(addscrape|svscrape|savescrape|as)$/i
handler.owner = true // MUTLAK: Hanya Boss (Owner) yang bisa mencipta!

module.exports = handler