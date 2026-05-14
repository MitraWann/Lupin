const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { retrieve, clean } = require('../lib/cdn-helper')

let handler = async (m, { conn, text }) => {
    if (!text) throw 'Masukkan link atau identifier.\nContoh: *.get https://mitra.wan/1a2b3c4d* atau *.get 1a2b3c4d*'
    
    // Parse input: bisa link penuh atau identifier saja
    let identifier = text.trim()
    
    // Jika berbentuk link, ekstrak identifier-nya
    if (identifier.includes('mitra.wan/')) {
        identifier = identifier.split('mitra.wan/')[1].replace(/\/+$/, '')
    }
    
    // Bersihkan karakter tidak valid
    identifier = identifier.toLowerCase().replace(/[^a-f0-9]/g, '')
    
    if (!identifier || identifier.length < 8) throw 'Identifier tidak valid.'
    
    // Ambil data dari database
    const entry = retrieve(identifier)
    if (!entry) throw 'Link tidak ditemukan atau sudah expired.'
    
    const { url, mediaKey: mediaKeyB64, type, mediaKeyTimestamp } = entry
    
    // Konversi mediaKey dari base64 ke Buffer
    const mediaKey = Buffer.from(mediaKeyB64, 'base64')
    const directPath = url.replace('https://mmg.whatsapp.net', '')
    
    await m.reply('⏳ Mengunduh...')
    
    // Unduh dari CDN WhatsApp
    const downloadType = type === 'sticker' ? 'sticker' : type
    const stream = await downloadContentFromMessage(
        {
            url,
            mediaKey,
            directPath,
            mediaKeyTimestamp: mediaKeyTimestamp ? parseInt(mediaKeyTimestamp) : Date.now()
        },
        downloadType
    )
    
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    
    // Kirim sesuai tipe
    const sendMap = {
        image: { image: buffer, caption: `🆔 ${identifier}` },
        video: { video: buffer, caption: `🆔 ${identifier}` },
        audio: { audio: buffer, mimetype: 'audio/mp4' },
        document: { document: buffer, fileName: 'file', mimetype: 'application/octet-stream' },
        sticker: { sticker: buffer }
    }
    
    const sendConfig = sendMap[type]
    if (!sendConfig) throw `Tipe media "${type}" tidak didukung.`
    
    await conn.sendMessage(m.chat, sendConfig, { quoted: m })
    
    // Cleanup otomatis
    clean()
}

handler.help = ['get <link>']
handler.tags = ['tools']
handler.command = /^(get)$/i

module.exports = handler