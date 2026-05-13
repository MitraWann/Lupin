const { encryptedStream, proto } = require('@whiskeysockets/baileys');

let handler = async (m, { conn }) => {
  const quoted = m.quoted
  if (!quoted) return conn.reply(m.chat, '❌ Reply ke pesan poll terlebih dahulu', m)

  const isPoll = quoted.mtype === 'pollCreationMessage' ||
                 quoted.mtype === 'pollCreationMessageV2' ||
                 quoted.mtype === 'pollCreationMessageV3' ||
                 quoted.mtype === 'pollCreationMessageV4' ||
                 quoted.mtype === 'pollCreationMessageV5'

  if (!isPoll) return conn.reply(m.chat, '❌ Pesan yang di-reply bukan poll', m)

  const media = m.quoted?.msg || m.msg
  if (!media?.mimetype?.startsWith('image/')) {
    return conn.reply(m.chat, '❌ Attach gambar bersamaan dengan perintah ini', m)
  }

  try {
    const caption = m.text || ''
    const buffer = await conn.downloadMediaMessage(m.quoted?.quoted || m)

    const mediaType = 'image'
    const encResult = await encryptedStream(buffer, mediaType)
    const fileEncSha256B64 = encResult.fileEncSha256.toString('base64')

    const uploadResult = await conn.waUploadToServer(
      encResult.encFilePath,
      { mediaType, fileEncSha256B64 }
    )

    const parentMessageKey = {
      remoteJid: m.chat,
      fromMe: quoted.fromMe,
      id: quoted.id,
    }

    await conn.relayMessage(m.chat, {
      pollCreationOptionImageMessage: {
        message: {
          imageMessage: {
            url: uploadResult.url,
            mimetype: media.mimetype,
            caption,
            fileSha256: encResult.fileSha256,
            fileLength: buffer.length,
            directPath: uploadResult.directPath,
            mediaKey: encResult.mediaKey,
            fileEncSha256: encResult.fileEncSha256,
            thumbnailDirectPath: uploadResult.directPath,
            thumbnailSha256: encResult.fileSha256,
            thumbnailEncSha256: encResult.fileEncSha256,
            contextInfo: {
              pairedMediaType: 'NOT_PAIRED_MEDIA'
            }
          }
        }
      },
      messageContextInfo: {
        messageAssociation: {
          associationType: proto.MessageAssociation?.AssociationType?.MEDIA_POLL || 2,
          parentMessageKey,
        }
      }
    }, { messageId: conn.generateMessageTag() })

  } catch (e) {
    conn.reply(m.chat, `❌ Error: ${e.message}`, m)
  }
}

handler.help = ['mediapoll']
handler.tags = ['tools']
handler.command = ['mediapoll']
handler.owner = false
handler.group = false
handler.private = false

module.exports = handler