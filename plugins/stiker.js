const fs = require('fs')
const fsp = fs.promises
const { tmpdir } = require('os')
const path = require('path')

let handler = async (m, { conn, command, usedPrefix }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  
  if (/image/.test(mime)) {
    let media = await q.download() // ini buffer
    m.reply(stiker_wait)
    
    // Tentukan ekstensi
    let ext = mime.split('/')[1] || 'jpg'
    let tmpFile = path.join(tmpdir(), `sticker_${Date.now()}.${ext}`)
    
    // Simpan buffer ke file sementara
    await fsp.writeFile(tmpFile, media)
    
    try {
      // Kirim stiker DENGAN PATH FILE
      let encmedia = await conn.sendImageAsSticker(m.chat, tmpFile, m, { 
        packname: global.packname, 
        author: global.author 
      })
      // Hapus file hasil stiker (jika encmedia adalah path)
      await fsp.unlink(encmedia).catch(() => {})
    } finally {
      // Hapus file sementara
      await fsp.unlink(tmpFile).catch(() => {})
    }
    
  } else if (/video/.test(mime)) {
    if ((q.msg || q).seconds > 7) return m.reply('maksimal 6 detik!')
    let media = await q.download()
    m.reply(stiker_wait)
    
    let ext = mime.split('/')[1] || 'mp4'
    let tmpFile = path.join(tmpdir(), `sticker_${Date.now()}.${ext}`)
    
    await fsp.writeFile(tmpFile, media)
    
    try {
      let encmedia = await conn.sendVideoAsSticker(m.chat, tmpFile, m, { 
        packname: global.packname, 
        author: global.author 
      })
      await fsp.unlink(encmedia).catch(() => {})
    } finally {
      await fsp.unlink(tmpFile).catch(() => {})
    }
    
  } else {
    throw `Kirim Gambar/Video Dengan Caption ${usedPrefix + command}\nDurasi Video 1-6 Detik`
  }
}

handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = /^(stiker|s|sticker)$/i
handler.limit = true
module.exports = handler