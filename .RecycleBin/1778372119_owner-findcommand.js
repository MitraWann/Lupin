const fs = require('fs')
const path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `Masukkan nama command yang ingin dicari nama file-nya.\n*Format: ${usedPrefix + command} <cmd>*\n\n` +
            `*Contoh Penggunaan:*\n` +
            `> ${usedPrefix + command} ban\n` +
            `> ${usedPrefix + command} menu`
        )
    }

    let plugins = global.plugins
    let matches = []

    for (let filename in plugins) {
        let plugin = plugins[filename]
        if (!plugin) continue 

        let isMatch = false
        
        // 1. Cek di handler.command
        if (plugin.command) {
            if (plugin.command instanceof RegExp) {
                let regexStr = plugin.command.toString()
                // Abaikan Regex kosong bawaan (formalitas) yang bikin bug
                if (regexStr !== '/(?:)/' && regexStr !== '/(?:)/i') {
                    if (plugin.command.test(text) || regexStr.toLowerCase().includes(text.toLowerCase())) {
                        isMatch = true
                    }
                }
            } else if (typeof plugin.command === 'string') {
                if (plugin.command.toLowerCase().includes(text.toLowerCase())) isMatch = true
            } else if (Array.isArray(plugin.command)) {
                if (plugin.command.some(cmd => cmd.toLowerCase().includes(text.toLowerCase()))) isMatch = true
            }
        }

        // 2. Cek juga di handler.customPrefix (Untuk file seperti _salambot.js atau owner-exec.js)
        if (!isMatch && plugin.customPrefix) {
            if (plugin.customPrefix instanceof RegExp) {
                if (plugin.customPrefix.test(text) || plugin.customPrefix.toString().toLowerCase().includes(text.toLowerCase())) {
                    isMatch = true
                }
            } else if (typeof plugin.customPrefix === 'string') {
                if (plugin.customPrefix.toLowerCase().includes(text.toLowerCase())) isMatch = true
            }
        }

        // Jika cocok di command atau customPrefix, masukkan ke daftar
        if (isMatch) {
            matches.push(filename)
        }
    }

    if (matches.length === 0) {
        return m.reply(`❌ Tidak ditemukan file plugin dengan command atau prefix *"${text}"*.`)
    }

    let teks = `🔎 *HASIL PENCARIAN COMMAND* 🔎\n\n` +
               `> ⌨️ *Kata Kunci:* ${text}\n` +
               `> 📂 *Ditemukan:* ${matches.length} file\n\n` +
               `*Lokasi File:*\n`

    matches.forEach((file, i) => {
        // Ditambahkan backtick (`) agar mudah ditangkap oleh Regex saat di-reply
        teks += `> *${i + 1}.* \`${file}\`\n`
    })

    // Petunjuk untuk fitur baca file via reply
    teks += `\n_Balas (reply) pesan ini dengan *nomor urut* untuk melihat isi scriptnya._`

    await conn.sendMessage(m.chat, { text: teks.trim() }, { quoted: m })
}

// ==========================================
// FITUR BACA FILE OTOMATIS VIA REPLY (CLEAN CODE)
// ==========================================
handler.before = async function (m, { conn, isOwner }) {
    // 1. Keamanan ekstra: Hanya Owner
    if (!isOwner) return false 

    // 2. Pastikan pesan adalah balasan ke pesan bot
    if (!m.quoted || !m.quoted.fromMe || !m.quoted.text) return false

    // 3. Pastikan pesan yang dibalas adalah hasil pencarian file ini
    if (!m.quoted.text.includes('🔎 *HASIL PENCARIAN COMMAND* 🔎')) return false
    
    // 4. Ambil angka yang diketik Boss
    let num = parseInt(m.text.trim())
    if (isNaN(num)) return false 

    // 5. Ekstrak nama file berdasarkan nomor urut (menyesuaikan format list "> *1.* `file.js`")
    let match = m.quoted.text.match(new RegExp(`^> \\*${num}\\.\\*\\s*\`([^\`]+)\``, 'm'))
    if (!match) {
        await m.reply('⚠️ Nomor urut tidak valid atau tidak ada di dalam daftar.')
        return true
    }

    let filename = match[1]
    let filePath = path.join('./plugins', filename)

    if (!fs.existsSync(filePath)) {
        await m.reply(`⚠️ Command \`${filename}\` sudah tidak ditemukan di folder plugins.`)
        return true
    }

    // 6. Baca isi file dan kirimkan murni tanpa header
    let content = fs.readFileSync(filePath, 'utf-8')
    
    await conn.sendMessage(m.chat, {
        text: `${content}`
    }, { quoted: m })

    return true
}

handler.help = ['findcmd <cmd>']
handler.tags = ['owner']
handler.command = /^(findcmd|fc|caricmd)$/i
handler.owner = true

module.exports = handler