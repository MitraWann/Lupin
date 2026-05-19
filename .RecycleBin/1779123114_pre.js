const crypto = require('crypto')
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys')

let handler = async (m, { conn }) => {
    const imageUrl = 'https://files.catbox.moe/kkz2tk.png'
    const imageBuffer = await conn.getFile(imageUrl).then(f => f.data)

    const WAMC = await prepareWAMessageMedia({ image: imageBuffer }, {
        upload: conn.waUploadToServer,
        mediaTypeOverride: 'thumbnail-link'
    })
    const i = WAMC.imageMessage
    const link = 'https://flora.bot'

    await conn.relayMessage(m.chat, {
        messageContextInfo: {
            messageSecret: crypto.randomBytes(32)
        },
        extendedTextMessage: {
            text: `${link}\nHello World`,
            matchedText: link,
            canonicalUrl: link,
            title: 'Flora Bot',
            description: 'Test preview',
            previewType: 0,
            jpegThumbnail: i.jpegThumbnail,
            thumbnailDirectPath: i.directPath,
            thumbnailSha256: i.fileSha256,
            thumbnailEncSha256: i.fileEncSha256,
            mediaKey: i.mediaKey,
            mediaKeyTimestamp: Number(i.mediaKeyTimestamp),
            thumbnailHeight: i.height || 512,
            thumbnailWidth: i.width || 512,
            inviteLinkGroupTypeV2: 0
        }
    }, {})
}

handler.help = ['testpreview']
handler.tags = ['main']
handler.command = /^(testpreview)$/i

module.exports = handler