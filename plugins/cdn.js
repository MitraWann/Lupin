const { Button } = require('../lib/MessageBuilder.js') // sesuaikan path

let handler = async (m, { conn }) => {
  const quoted = m.quoted
  if (!quoted) throw 'Reply ke pesan gambar/video/dokumen.'

  const directPath = quoted.directPath || quoted.thumbnailDirectPath
  const url = directPath
    ? `https://mmg.whatsapp.net${directPath.startsWith('/') ? '' : '/'}${directPath}`
    : quoted.url

  if (!url) throw 'Tidak ada CDN URL ditemukan.'

  const mediaKey = quoted.mediaKey
    ? Buffer.from(quoted.mediaKey).toString('base64')
    : null

  const btn = new Button()
  btn.setBody('Detail Media')
  btn.addCopy('Salin URL', url, 'copy_cdn_url')
  if (mediaKey) {
    btn.addCopy('Salin Media Key', mediaKey, 'copy_media_key')
  }

  // Gunakan m (pesan asli) sebagai quoted, bukan m.quoted
  await btn.run(m.chat, conn, m)
}

handler.help = ['cdn']
handler.tags = ['tools']
handler.command = /^(cdn)$/i

module.exports = handler