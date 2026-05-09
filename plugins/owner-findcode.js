/**
 * Plugin: Global Code Finder
 * Description: Mencari potongan kode secara menyeluruh di semua sub-direktori bot.
 */

const fs = require('fs')
const path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Masukkan potongan kode yang ingin dicari!\n\nContoh penggunaan:\n> ${usedPrefix + command} m.sender.split('@')[0]`)

    // Berikan indikator loading karena proses ini memakan waktu (I/O operation)
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    await m.reply(global.wait || '🔍 _Radar diaktifkan! Sedang memindai seluruh direktori bot, mohon tunggu..._')

    let rootDir = process.cwd()
    let results = []

    // ⚠️ GUARDRAIL: Daftar direktori yang WAJIB diabaikan agar bot tidak crash / memakan waktu berjam-jam
    const ignoreList = ['node_modules', '.git', 'sessions', 'tmp', 'store']

    // Fungsi rekursif untuk membaca file di dalam folder dan sub-folder
    const scanDirectory = (dir) => {
        let files
        try {
            files = fs.readdirSync(dir)
        } catch (e) {
            return // Lewati jika folder tidak memiliki akses izin baca
        }

        for (let file of files) {
            let fullPath = path.join(dir, file)
            let relativePath = path.relative(rootDir, fullPath)

            // Skip folder/file yang ada di dalam daftar ignoreList
            if (ignoreList.some(ignored => relativePath.startsWith(ignored) || file === ignored)) continue

            let stat
            try {
                stat = fs.statSync(fullPath)
            } catch (e) {
                continue
            }

            if (stat.isDirectory()) {
                // Jika itu adalah folder, panggil fungsi ini lagi untuk masuk ke dalamnya
                scanDirectory(fullPath)
            } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.json')) {
                // Hanya baca file teks/kode, hindari membaca file media (gambar/video) menjadi string
                try {
                    let content = fs.readFileSync(fullPath, 'utf-8')
                    let lines = content.split('\n')
                    let foundLines = []

                    // Mencari teks di setiap baris
                    lines.forEach((line, index) => {
                        if (line.includes(text)) {
                            foundLines.push(index + 1)
                        }
                    })

                    // Jika ditemukan, masukkan ke dalam daftar hasil
                    if (foundLines.length > 0) {
                        // Ubah backslash (Windows) menjadi slash standar agar rapi
                        let cleanPath = relativePath.replace(/\\/g, '/')
                        results.push(`📄 *${cleanPath}*\n> Baris: ${foundLines.join(', ')}`)
                    }
                } catch (e) {
                    // Abaikan jika file corrupt / gagal dibaca
                }
            }
        }
    }

    // Mulai proses pemindaian dari root direktori bot
    scanDirectory(rootDir)

    if (results.length === 0) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        return m.reply(`🔍 Kode \`${text}\` tidak ditemukan di direktori manapun.`)
    }

    // Menyusun laporan akhir
    let replyText = `🎯 *PENCARIAN KODE SELESAI*\n──────────────────\n\n🔍 *Pencarian:* \`${text}\`\n📁 *Terdeteksi pada:* ${results.length} file\n\n`
    
    // Membatasi output agar WhatsApp tidak lag jika hasil pencarian terlalu banyak (WhatsApp limit)
    const MAX_RESULTS_DISPLAY = 150
    replyText += results.slice(0, MAX_RESULTS_DISPLAY).join('\n\n')

    if (results.length > MAX_RESULTS_DISPLAY) {
        replyText += `\n\n──────────────────\n_...dan ${results.length - MAX_RESULTS_DISPLAY} file lainnya._\n> _Hasil dibatasi agar chat tidak terlalu panjang._`
    }
    
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    m.reply(replyText)
}

handler.help = ['findcode <code>']
handler.tags = ['owner']
handler.command = /^(findcode|carikode|ck)$/i
handler.owner = true

module.exports = handler