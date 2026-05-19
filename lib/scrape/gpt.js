'use strict'

const crypto = require('crypto')

const PK = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCAdf/EyIbLBxjGqmh7qLU6/CPCzru+75+82OSPZ+nf4BFvg88drpZ6KigNW0J8TNgxe6Yms1irCZNVDyu+RXsl4y/7c2KOHc4OGTzHB5fUMiMasFUvcEs2P70e6yA/sKHZfBLG1XPhlb84Ibs3nhD3W5e2SuC+4EuVkaqzN08LQIDAQAB'
const PEM = `-----BEGIN PUBLIC KEY-----\n${PK.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36'
const BASE_URL = 'https://aga-api.aichatting.net'

function chunkText(text, size = 3800, overlap = 200) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + size))
    i += size - overlap
  }
  return chunks
}
const PLAIN_TEXT_EXTS = /\.(js|mjs|cjs|json|html|htm|xml|css|ts|tsx|jsx|txt|csv|md|yaml|yml|ini|env|sh|py|java|c|cpp|cs|go|rb|php|sql)$/i

async function extractDocumentText(buffer, mimetype = '', filename = '') {
  if (mimetype.includes('pdf')) {
    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse({ data: buffer, verbosity: 0 })
    await parser.load()
    const result = await parser.getText()
    return result.pages.map(p => p.text).join('\n').trim()
  }
  if (mimetype.includes('wordprocessingml') || mimetype.includes('msword') || filename.endsWith('.docx') || filename.endsWith('.doc')) {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }
  if (mimetype.includes('spreadsheetml') || mimetype.includes('ms-excel') || filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    const XLSX = require('xlsx')
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const combined = wb.SheetNames.map(name => {
      const ws = wb.Sheets[name]
      return `[Sheet: ${name}]\n${XLSX.utils.sheet_to_csv(ws)}`
    }).join('\n\n').trim()
    return combined
  }
  if (PLAIN_TEXT_EXTS.test(filename) || mimetype.startsWith('text/')) {
    return buffer.toString('utf8').trim()
  }
  throw new Error(`Tipe file tidak didukung: ${filename || mimetype}`)
}
const MODELS = {
  'gpt-4o-mini': { endpoint: '/aigc/chat/v2/professional/stream', label: 'GPT-4o Mini' },
  'gpt-4.1-mini': { endpoint: '/aigc/chat/v2/askai/stream', label: 'GPT-4.1 Mini' },
}

async function getAuth() {
  const res = await fetch('https://www.aichatting.net/', { headers: { 'user-agent': UA } })
  const raw = res.headers.get('set-cookie') || ''
  const mo_uuid = (raw.match(/mo_uuid=([^;,]+)/) || [])[1] || ''
  const group_index = (raw.match(/group_index=([^;,]+)/) || [])[1] || '0'
  const vtoken = crypto.publicEncrypt(
    { key: PEM, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(mo_uuid)
  ).toString('base64')
  return { mo_uuid, group_index, vtoken }
}

function parseStream(raw) {
  return raw
    .split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => {
      const d = l.slice(5)
      if (d === '--@DONE@--') return null
      if (d.match(/^(-=- --)+$/)) return ' '
      if (d.startsWith('-=- --')) return ' ' + d.replace(/^(-=- --)+/, '')
      return d
    })
    .filter(l => l !== null)
    .join('')
    .replace(/(-=-n--)+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .replace(/ ([.,!?])/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .trim()
}

function toDataUrl(buffer, mime = 'image/jpeg') {
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function buildDocumentMessages(docText, filename = '') {
  const chunks = chunkText(docText)
  if (chunks.length === 1) return null
  const messages = []
  chunks.forEach((chunk, i) => {
    messages.push({
      role: 'user',
      content: [{ type: 'text', text: `[Dokumen: ${filename} | Bagian ${i + 1}/${chunks.length}]\n${chunk}` }]
    })
    messages.push({
      role: 'assistant',
      content: [{ type: 'text', text: `Bagian ${i + 1} diterima.` }]
    })
  })
  return messages
}

async function askAichatting(session, userContent, MAX_HISTORY = 20) {
  const { mo_uuid, group_index, vtoken } = await getAuth()
  const { endpoint } = MODELS[session.model] || MODELS['gpt-4o-mini']

  const userMsg = { role: 'user', content: userContent }
  const docMessages = userContent._docMessages || []
  const messages = [...session.messages, ...docMessages, userMsg]

  const body = {
    spaceHandle: true,
    roleId: 0,
    messages,
    conversationId: session.conversationId,
    model: session.model,
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': UA,
      'vtoken': vtoken,
      'source': 'web',
      'accept': 'text/event-stream,application/json',
      'origin': 'https://www.aichatting.net',
      'referer': 'https://www.aichatting.net/',
      'lang': 'en',
      'cookie': `aichatting.website.periodType=; mo_uuid=${mo_uuid}; group_index=${group_index}`,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  const answer = parseStream(text)
  if (!answer) throw new Error('Respon kosong dari server')

  session.messages.push(userMsg)
  session.messages.push({ role: 'assistant', content: [{ type: 'text', text: answer }] })
  if (session.messages.length > MAX_HISTORY) {
    session.messages = session.messages.slice(-MAX_HISTORY)
  }

  return answer
}

module.exports = { getAuth, parseStream, toDataUrl, askAichatting, extractDocumentText, buildDocumentMessages, MODELS }

// test watch
// test watch
// test watch