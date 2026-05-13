const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

let handler = async (m, { conn, text }) => {
  if (!text) throw 'Format: .getcdn <url> | <mediaKey>'

  const parts = text.split('|').map(s => s.trim())
  if (parts.length < 2) throw 'Format: .getcdn <url> | <mediaKey>'

  const [url, mediaKeyB64] = parts
  const mediaKey = Buffer.from(mediaKeyB64, 'base64')
  const directPath = url.replace('https://mmg.whatsapp.net', '')

  const stream = await downloadContentFromMessage(
    { url, mediaKey, directPath, mediaKeyTimestamp: Date.now() },
    'image'
  )

  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const buffer = Buffer.concat(chunks)

  await conn.sendMessage(m.chat, { image: buffer }, { quoted: m })
}

handler.help = ['getcdn <url> | <mediaKey>']
handler.tags = ['tools']
handler.command = /^(getcdn)$/i

module.exports = handler