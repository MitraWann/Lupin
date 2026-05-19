let handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  let isAnim = q.isAnimated || false

  if (!/webp/.test(mime)) throw 'Reply stiker yang ingin diubah watermark-nya.'
  if (!text) throw `Contoh: ${usedPrefix}${command} Nama Pack|Nama Author`

  let [packname, author] = text.split('|').map(s => s.trim())
  if (!packname) throw 'Nama pack tidak boleh kosong'
  if (!author) author = ''

  await m.reply('⏳ Memproses...')

  try {
    let buffer = await q.download()
    if (!buffer) throw 'Gagal mengunduh stiker.'

    if (isAnim) {
      // Stiker animasi → kirim ulang dengan metadata WhatsApp (pack/author)
      await conn.sendMessage(m.chat, {
        sticker: buffer,
        pack: packname,
        author: author
      }, { quoted: m })
    } else {
      // Stiker biasa → gunakan sendImageAsSticker
      await conn.sendImageAsSticker(m.chat, buffer, m, { packname, author })
    }

    m.reply('✅ Watermark berhasil diubah!')
  } catch (e) {
    console.error(e)
    throw `Gagal mengubah watermark: ${e.message}`
  }
}

handler.help = ['setwm <pack|author>']
handler.tags = ['sticker']
handler.command = /^(setwm|ubahwm)$/i
handler.limit = true

module.exports = handler