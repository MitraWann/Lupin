const { toAudio, toPTT } = require('../lib/converter')

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (m.quoted ? m.quoted : m.msg).mimetype || ''
  
  // ==========================================
  // FITUR: TO MP3 / AUDIO (Inline Music Player)
  // ==========================================
  if (/mp3|a(udio)?$/i.test(command)) {
    if (!/video|audio/.test(mime)) throw `Balas video/audio dengan perintah *${usedPrefix + command}*`
    await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } })
    
    let media = await q.download()
    if (!media) throw global.eror
    
    let audio = await toAudio(media, 'mp4')
    if (!audio.data) throw 'Gagal melakukan konversi.'
    
    await conn.sendMessage(m.chat, { 
        audio: audio.data, 
        mimetype: 'audio/mp4' // Standar mimetype untuk music player WA
    }, { quoted: m })
  }
  
  // ==========================================
  // FITUR: TO VN / PTT (Voice Note)
  // ==========================================
  if (/vn|ptt$/i.test(command)) {
    if (!/video|audio/.test(mime)) throw `Balas video/audio dengan perintah *${usedPrefix + command}*`
    await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } })
    
    let media = await q.download()
    if (!media) throw global.eror
    
    let audio = await toPTT(media, 'mp4')
    if (!audio.data) throw 'Gagal melakukan konversi.'
    
    await conn.sendMessage(m.chat, { 
        audio: audio.data, 
        mimetype: 'audio/ogg; codecs=opus', // Standar mimetype khusus PTT WA
        ptt: true // Flag pembentuk UI pesan Voice Note
    }, { quoted: m })
  }
}

handler.help = ['tomp3', 'tovn']
handler.tags = ['voice']
handler.command = /^to(mp3|vn|ptt)$/i

module.exports = handler