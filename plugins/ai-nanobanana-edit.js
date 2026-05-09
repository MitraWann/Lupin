const nanoBanana = require('../lib/nanobanana.js')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validasi Prompt
    if (!text) {
        return m.reply(
            `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n` +
            `> Edit gambar dengan AI menggunakan prompt\n\n` +
            `*Contoh:* \`${usedPrefix + command} make it anime style\`\n\n` +
            `> _Reply atau kirim gambar dengan caption tersebut_`
        )
    }

    // 2. Logika Deteksi Gambar (Pesan langsung atau Reply)
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    
    // Mengecek apakah itu benar-benar gambar
    let isImage = /image\/(jne?pg|png)/.test(mime) || q.mtype === 'imageMessage'

    if (!isImage) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n> Gagal mendeteksi gambar. Pastikan me-reply (membalas) pesan gambar atau mengirim gambar langsung dengan caption prompt!`)
    }

    // 3. Mulai Proses
    await conn.sendMessage(m.chat, { react: { text: '🍌', key: m.key } })
    await m.reply(`⏳ *ᴘʀᴏsᴇs...*\n\n> Sedang mengedit gambar dengan AI...\n> Mohon tunggu sebentar.`)

    try {
        // 4. Download Gambar (Gunakan fungsi download internal)
        let mediaBuffer = await q.download?.()
        
        // Backup jika q.download tidak tersedia
        if (!mediaBuffer && conn.downloadMediaMessage) {
            mediaBuffer = await conn.downloadMediaMessage(q)
        }
        
        if (!mediaBuffer) throw 'Gagal mengunduh gambar. Pastikan media masih tersedia.'

        // 5. Kirim ke Scraper NanoBanana
        const resultBuffer = await nanoBanana(mediaBuffer, text)

        if (!resultBuffer || !Buffer.isBuffer(resultBuffer)) {
            throw 'API tidak memberikan hasil gambar atau scraper bermasalah.'
        }

        // 6. Kirim Hasil Final
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        
        await conn.sendMessage(m.chat, {
            image: resultBuffer,
            caption: `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ ᴘʀᴏ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘʀᴏᴍᴘᴛ:\n> ${text}\n` +
                `┃ 🤖 ᴍᴏᴅᴇʟ: Nano Banana\n` +
                `╰┈┈⬡`
        }, { quoted: m })

    } catch (error) {
        console.error('NanoBanana Error:', error)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        m.reply(`🍀 *Waduhh, sepertinya ada kendala.*\n\n> *Error:* ${error.message || error}`)
    }
}

handler.help = ['nanoedit <prompt>']
handler.tags = ['ai']
handler.command = /^(nanobananaedit|nanoedit|bananaedit)$/i
handler.limit = true;
handler.token = 5;

module.exports = handler