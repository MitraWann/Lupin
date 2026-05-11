let fs = require('fs')
let path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // ==========================================
    // PERBAIKAN: FORMAT ERROR DISAMAKAN DENGAN FINDPLUGIN
    // ==========================================
    if (!text) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `Masukkan keyword nama file plugin yang ingin Anda cari!\n*Format: ${usedPrefix + command} <keyword>*\n\n` +
            `*Contoh Penggunaan:*\n` +
            `> ${usedPrefix + command} profile\n` +
            `> ${usedPrefix + command} menu`
        )
    }

    let query = text.toLowerCase().trim()
    
    // Langsung membaca isi dari folder 'plugins'
    let pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'))
    
    // Menyaring file yang namanya mengandung kata kunci pencarian
    let results = pluginFiles.filter(file => file.toLowerCase().includes(query))

    // Jika tidak ada hasil
    if (results.length === 0) {
        return m.reply(`⛔ Tidak ditemukan file plugin dengan nama yang mengandung kata *"${query}"*.`)
    }

    // Merakit pesan balasan
    let teks = `🔍 *HASIL PENCARIAN FILE PLUGIN* 🔍\n\n` +
               `> ⌨️ *Kata Kunci:* ${query}\n` +
               `> 📂 *Ditemukan:* ${results.length} file\n\n` +
               `*Lokasi File:*\n`
               
    results.forEach((file, index) => {
        teks += `> *${index + 1}.* \`${file}\`\n`
    })
    
    // Memberikan petunjuk fitur baru
    teks += `\n_Balas (reply) pesan ini dengan *nomor urut* untuk melihat isi kodenya._`

    m.reply(teks)
}

// ==========================================
// FITUR BACA FILE OTOMATIS VIA REPLY
// ==========================================
handler.before = async function (m, { conn, isOwner }) {
    // 1. Keamanan ekstra: Hanya Owner yang boleh mengintip kode!
    if (!isOwner) return false 

    // 2. Pastikan pesan adalah balasan ke pesan bot
    if (!m.quoted || !m.quoted.fromMe || !m.quoted.text) return false

    // 3. Pastikan pesan yang dibalas adalah hasil pencarian file ini (Header disesuaikan)
    if (!m.quoted.text.includes('🔍 *HASIL PENCARIAN FILE PLUGIN* 🔍')) return false
    
    // 4. Ambil angka yang diketik Boss
    let num = parseInt(m.text.trim())
    if (isNaN(num)) return false // Abaikan jika balasannya bukan angka murni

    // 5. Ekstrak nama file berdasarkan nomor urut (Regex disamakan dengan findplugin)
    let match = m.quoted.text.match(new RegExp(`^> \\*${num}\\.\\*\\s*\`([^\`]+)\``, 'm'))
    if (!match) {
        await m.reply('⚠️ Nomor urut tidak valid atau tidak ada di dalam daftar.')
        return true
    }

    let filename = match[1]
    let filePath = path.join('./plugins', filename)

    if (!fs.existsSync(filePath)) {
        await m.reply(`⚠️ File \`${filename}\` sudah tidak ditemukan di folder plugins.`)
        return true
    }

    // 6. Baca isi file dan kirimkan ke Boss secara bersih (Clean Code Output)
    let content = fs.readFileSync(filePath, 'utf-8')
    
    await conn.sendMessage(m.chat, {
        text: `${content}`
    }, { quoted: m })

    return true
}

handler.help = ['findplugin <keyword>']
handler.tags = ['owner']
handler.command = /^(findplugin|cariplugin|fp|cp)$/i
handler.owner = true 

module.exports = handler