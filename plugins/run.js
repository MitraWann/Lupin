let handler = async (m, { conn }) => {
  if (!m.quoted) throw 'Reply pesan yang berisi raw JSON.'

  const raw = m.quoted.text
  if (!raw) throw 'Pesan yang di-reply tidak memiliki teks.'

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw 'JSON tidak valid.'
  }

  const msgContent = parsed.message
  if (!msgContent) throw 'Field `message` tidak ditemukan.'

  const { generateMessageID } = require('@whiskeysockets/baileys')

  await conn.relayMessage(m.chat, msgContent, { messageId: generateMessageID() })
}

handler.help = ['run']
handler.tags = ['tools']
handler.command = /^(run)$/i

module.exports = handler