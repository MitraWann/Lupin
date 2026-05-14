const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'memo', 'cdn.json')
const MAX_AGE_DAYS = 30

let handler = async (m, { conn, text }) => {
  if (!text) throw 'Masukkan URL (atau potongan URL) yang sudah disimpan dengan *.cdn*'

  // Baca database
  let db = []
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  } catch (e) {
    throw 'Database CDN belum ada. Simpan dulu dengan *.cdn*'
  }

  // Hapus entri lama (>30 hari)
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  db = db.filter(e => new Date(e.savedAt).getTime() > cutoff)
  // Simpan ulang database bersih
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))

  // Cari entry yang cocok
  const entry = db.find(e => e.url.includes(text.trim()))
  if (!entry) throw 'URL tidak ditemukan di database.'

  const { url, mediaKey: mediaKeyB64, type, mediaKeyTimestamp } = entry
  const mediaKey = Buffer.from(mediaKeyB64, 'base64')
  const directPath = url.replace('https://mmg.whatsapp.net', '')

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

  const sendType = {
    image: { image: buffer },
    video: { video: buffer },
    audio: { audio: buffer, mimetype: 'audio/mp4' },
    document: { document: buffer, mimetype: 'application/octet-stream', fileName: 'file' },
    sticker: { sticker: buffer }
  }[type]

  if (!sendType) throw 'Tipe media tidak didukung.'

  await conn.sendMessage(m.chat, sendType, { quoted: m })
}

handler.help = ['getcdn <url>']
handler.tags = ['tools']
handler.command = /^(getcdn)$/i

module.exports = handler