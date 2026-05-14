const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'memo', 'cdn.json')
const MAX_AGE_DAYS = 30 // hapus entri lebih tua dari 30 hari

let handler = async (m, { conn }) => {
  const quoted = m.quoted
  if (!quoted) throw 'Reply ke pesan media (gambar/video/dokumen/stiker).'

  // Ambil data media dari nested / root
  const inner =
    quoted.message?.stickerMessage ||
    quoted.message?.imageMessage ||
    quoted.message?.videoMessage ||
    quoted.message?.documentMessage ||
    quoted.message?.audioMessage

  const src = inner || quoted

  const directPath = src.directPath || src.thumbnailDirectPath
  const url = directPath
    ? `https://mmg.whatsapp.net${directPath.startsWith('/') ? '' : '/'}${directPath}`
    : src.url || quoted.url

  if (!url) throw 'Tidak ada CDN URL ditemukan.'

  const mediaKey = src.mediaKey
    ? Buffer.from(src.mediaKey).toString('base64')
    : null

  if (!mediaKey) throw 'Media key tidak ditemukan.'

  const mediaKeyTimestamp = src.mediaKeyTimestamp?.toString() || null

  // Tentukan tipe
  let type = quoted.mtype || quoted.mtypeFull || ''
  if (type.startsWith('image')) type = 'image'
  else if (type.startsWith('video')) type = 'video'
  else if (type.startsWith('audio')) type = 'audio'
  else if (type.startsWith('sticker')) type = 'sticker'
  else if (type.startsWith('document')) type = 'document'
  else if (type.startsWith('lottieSticker')) type = 'sticker'
  else type = 'image'

  // Siapkan direktori
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Baca database
  let db = []
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  } catch (e) {}

  // Hapus entri lama (>30 hari)
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  db = db.filter(e => new Date(e.savedAt).getTime() > cutoff)

  // Tambahkan entry baru
  db.push({
    url,
    mediaKey,
    mediaKeyTimestamp,
    type,
    savedAt: new Date().toISOString()
  })

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))

  conn.reply(m.chat, `🔗 URL: ${url}\n📦 Tipe: ${type}\n⏳ Retensi: ${MAX_AGE_DAYS} hari\n\nGunakan *.getcdn <url>* untuk mengunduh ulang.`, m)
}

handler.help = ['cdn']
handler.tags = ['tools']
handler.command = /^(cdn)$/i

module.exports = handler