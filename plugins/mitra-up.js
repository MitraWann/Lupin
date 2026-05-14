const { store } = require('../lib/cdn-helper')
const { Button } = require('../lib/MessageBuilder.js')

let handler = async (m, { conn }) => {
    let q = m.quoted
    if (!q) throw 'Reply media (gambar/video/stiker/dokumen).'
    
    // Ambil data CDN
    const inner = q.message?.stickerMessage || q.message?.imageMessage || 
                  q.message?.videoMessage || q.message?.documentMessage || 
                  q.message?.audioMessage
    
    const src = inner || q
    const directPath = src.directPath || src.thumbnailDirectPath
    const url = directPath 
        ? `https://mmg.whatsapp.net${directPath.startsWith('/') ? '' : '/'}${directPath}` 
        : src.url || q.url
    
    if (!url) throw 'URL CDN tidak ditemukan.'
    
    const mediaKeyRaw = src.mediaKey || q.mediaKey
    const mediaKey = mediaKeyRaw 
        ? Buffer.from(mediaKeyRaw).toString('base64') 
        : null
    
    if (!mediaKey) throw 'Media key tidak ditemukan.'
    
    // Tentukan tipe
    let type = q.mtype || ''
    if (type.startsWith('image')) type = 'image'
    else if (type.startsWith('video')) type = 'video'
    else if (type.startsWith('audio')) type = 'audio'
    else if (type.startsWith('sticker') || type.startsWith('lottie')) type = 'sticker'
    else if (type.startsWith('document')) type = 'document'
    else type = 'image'
    
    const mediaKeyTimestamp = src.mediaKeyTimestamp?.toString() || null
    
    // Simpan ke CDN storage
    const identifier = store(url, mediaKey, type, mediaKeyTimestamp)
    const shortLink = `https://mitra.wan/${identifier}`
    
    // Kirim tombol salin
    const btn = new Button()
    btn.setBody(`✅ Media tersimpan!\n\n🔗 Link: ${shortLink}\n📦 Tipe: ${type}`)
       .addCopy('📋 Salin Link', shortLink, 'copy_link')
       .addReply('ℹ️ Cara Pakai', 'help_get')
    await btn.run(m.chat, conn, m)
}

handler.help = ['up']
handler.tags = ['tools']
handler.command = /^(up)$/i

module.exports = handler