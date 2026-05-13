const fs = require('fs')
const path = require('path')

const PRODUCTS_PATH = path.join(__dirname, '../products.json')

const handler = async (m, { conn, usedPrefix }) => {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))
    const { encryptedStream } = require('@whiskeysockets/baileys')

    for (const product of products) {
        const imageBuffer = await conn.getFile(product.image).then(f => f.data)
        const mediaType = 'thumbnail-link'
        const encResult = await encryptedStream(imageBuffer, mediaType)
        const fileEncSha256B64 = encResult.fileEncSha256.toString('base64')
        const uploadResult = await conn.waUploadToServer(
            encResult.encFilePath,
            { mediaType, fileEncSha256B64 }
        )
        const placeholder = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAADElEQVR4nGNgGG4AAADSAAFQmYCvAAAAAElFTkSuQmCC',
            'base64'
        )
        const msgContent = {
            extendedTextMessage: {
                text: `https://flora.bot\n\n🛍️ *${product.name}*\n${product.description}\n\n💰 Rp ${product.price.toLocaleString('id-ID')}\n\n📦 Order: ${usedPrefix}order ${product.id}`,
                matchedText: 'https://flora.bot',
                canonicalUrl: 'https://flora.bot',
                title: product.name,
                description: `Rp ${product.price.toLocaleString('id-ID')} • ${usedPrefix}order ${product.id}`,
                previewType: 'NONE',
                jpegThumbnail: placeholder,
                thumbnailDirectPath: uploadResult.directPath,
                thumbnailSha256: encResult.fileSha256,
                thumbnailEncSha256: encResult.fileEncSha256,
                mediaKey: encResult.mediaKey,
                mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                thumbnailWidth: 800,
                thumbnailHeight: 800,
            }
        }
        await conn.relayMessage(m.chat, msgContent, {
            messageId: conn.generateMessageTag(),
        })
        await new Promise(r => setTimeout(r, 1000))
    }
}

handler.help = ['catalog']
handler.tags = ['order']
handler.command = /^(catalog|katalog)$/i

module.exports = handler
