const { encryptedStream } = require('@whiskeysockets/baileys')
const Jimp = require('jimp')

let cachedThumb = null

async function prepareThumb(conn) {
    if (cachedThumb) return cachedThumb

    const mediaType = 'thumbnail-link'
    const imageBuffer = await conn.getFile('https://cdn.filn.pp.ua/uploads/betabotzapi/f1eef.jpg').then(f => f.data)

    const encResult = await encryptedStream(imageBuffer, mediaType)
    const fileEncSha256B64 = encResult.fileEncSha256.toString('base64')
    const uploadResult = await conn.waUploadToServer(
        encResult.encFilePath,
        { mediaType, fileEncSha256B64 }
    )

    const img = await Jimp.read(imageBuffer)

    cachedThumb = {
        thumbnailDirectPath: uploadResult.directPath,
        thumbnailSha256: encResult.fileSha256,
        thumbnailEncSha256: encResult.fileEncSha256,
        mediaKey: encResult.mediaKey,
        thumbnailWidth: img.getWidth(),
        thumbnailHeight: img.getHeight(),
    }

    return cachedThumb
}

const placeholder = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAADElEQVR4nGNgGG4AAADSAAFQmYCvAAAAAElFTkSuQmCC',
    'base64'
)

let handler = async (m, { conn }) => {
    const thumb = await prepareThumb(conn)

    await conn.relayMessage(m.chat, {
        extendedTextMessage: {
            text: `https://flora.sm\n\nThis is Go Youn-jung`,
            matchedText: 'https://flora.sm',
            canonicalUrl: 'https://flora.sm',
            title: 'Flora 🍀',
            description: 'Simple Whatsapp Bot',
            previewType: 'NONE',
            jpegThumbnail: placeholder,
            mediaKeyTimestamp: Math.floor(Date.now() / 1000),
            ...thumb
        }
    }, { messageId: conn.generateMessageTag() })
}

handler.help = ['gyj']
handler.tags = ['tools']
handler.command = /^(gyj)$/i
module.exports = handler