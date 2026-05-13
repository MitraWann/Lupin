let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) throw `Format salah!\n\nContoh:\n${usedPrefix + command} NamaGrup|@user1 @user2\n\natau bisa juga:\n${usedPrefix + command} NamaGrup`
  
  let [namagc, partText] = text.split('|').map(s => s.trim())
  if (!namagc) throw 'Nama grup tidak boleh kosong!'

  let peserta = [m.sender]
  
  if (partText) {
    let mentions = conn.parseMention(partText)
    if (mentions.length > 0) {
      peserta = [...new Set([...peserta, ...mentions])]
    }
  }

  // Membuat grup baru
  const group = await conn.groupCreate(namagc, peserta)
  const link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group.id)

  // ==========================================
  // PERBAIKAN 1: FORMAT TAG BERSIH
  // ==========================================
  let tag = `@${m.sender.replace(/@.+/, '')}`
  let mentionedJid = [m.sender]

  // 1. Kirim sapaan di dalam grup yang baru dibuat
  await conn.sendMessage(group.id, {
    text: `Halo semua! Grup ini dibuat oleh ${tag}`,
    mentions: mentionedJid,
    contextInfo: { mentionedJid }
  })

  // 2. Kirim laporan sukses ke chat saat ini (laporan ke Boss)
  let laporan = `✅ *Grup Berhasil Dibuat!*\n\n` +
                `> 📛 Nama: *${namagc}*\n` +
                `> 🔗 Link: ${link}\n` +
                `> 👤 Creator: ${tag}`

  conn.reply(m.chat, laporan, m, { contextInfo: { mentionedJid } })
}

handler.help = ['buatgrup']
handler.tags = ['owner']
handler.command = /^buatgrup$/i
handler.owner = true

module.exports = handler