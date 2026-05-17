'use strict'

const crypto = require('crypto')
const { askAichatting, toDataUrl, MODELS } = require('../lib/scrape/gpt')

const DEFAULT_MODEL = 'gpt-4o-mini'
const MAX_HISTORY = 20

global._gptSessions = global._gptSessions || {}

const handler = async (m, { conn, text, usedPrefix }) => {
  const userId = m.sender
  const input = (text || '').trim()

  if (!global._gptSessions[userId]) {
    global._gptSessions[userId] = {
      model: DEFAULT_MODEL,
      conversationId: crypto.randomInt(10000000, 99999999),
      messages: [],
    }
  }
  const session = global._gptSessions[userId]

  if (input.toLowerCase() === 'reset') {
    session.messages = []
    session.conversationId = crypto.randomInt(10000000, 99999999)
    return m.reply('🗑️ Memori sesi telah direset.')
  }

  if (input.toLowerCase().startsWith('set ')) {
    const req = input.slice(4).trim().toLowerCase()
    if (!MODELS[req]) {
      const list = Object.entries(MODELS).map(([k, v]) => `• \`${k}\` — ${v.label}`).join('\n')
      return m.reply(`❌ Model tidak dikenal.\n\nModel tersedia:\n${list}`)
    }
    session.model = req
    session.messages = []
    session.conversationId = crypto.randomInt(10000000, 99999999)
    return m.reply(`✅ Model diset ke *${MODELS[req].label}*\nSesi direset otomatis.`)
  }

  if (!input) {
    const list = Object.entries(MODELS).map(([k, v]) => `• \`${k}\` — ${v.label}`).join('\n')
    return m.reply(
      `*GPT Aichatting*\n\nPenggunaan:\n${usedPrefix}gpt <teks>\n${usedPrefix}gpt set <model>\n${usedPrefix}gpt reset\n\nModel aktif: *${MODELS[session.model].label}*\n\nModel tersedia:\n${list}`
    )
  }

  const userContent = [{ type: 'text', text: input }]

  if (m.quoted && m.quoted.download) {
    const mtype = (m.quoted.mtype || '').toLowerCase()
    if (mtype.includes('image') || mtype.includes('sticker')) {
      try {
        const buf = await m.quoted.download()
        const mime = mtype.includes('png') ? 'image/png' : 'image/jpeg'
        userContent.push({ type: 'image_url', image_url: { url: toDataUrl(buf, mime) } })
      } catch (e) {}
    }
  }

  await m.reply('⏳')

  try {
    const answer = await askAichatting(session, userContent, MAX_HISTORY)
    m.reply(answer)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.command = /^gpt$/i
handler.help = ['gpt <teks>']
handler.tags = ['ai']
handler.limit = false
handler.premium = false
handler.group = false
handler.private = false
handler.owner = false
handler.admin = false

module.exports = handler
