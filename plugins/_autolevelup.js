const { color } = require('../lib/color')
const levelling = require('../lib/levelling')

module.exports = {
    async before(m, { conn, isCommand }) {
        let user = global.db.data.users[m.sender]
        let chat = global.db.data.chats[m.chat] || {}

        // Validasi: Abaikan jika tidak ada user, atau user mematikan autolevelup
        if (!user || !user.autolevelup) return true

        let multiplier = global.multiplier || 36 
        let beforeLevel = user.level * 1
        
        // Kalkulasi target level sesungguhnya berdasarkan exp saat ini
        let targetLevel = levelling.findLevel(user.exp, multiplier)

        // Optimasi: Jika target level lebih besar dari level saat ini, langsung update levelnya
        if (targetLevel > user.level) {
            user.level = targetLevel 
            
            // Emoji saya bersihkan agar tidak muncul karakter aneh (mojibake)
            let chating = `🎉 *L E V E L  U P !*\n\n> 📊 *Level:* ${beforeLevel} ➔ *${user.level}*\n> 💡 *Ketik .profile untuk melihat status barumu.*`.trim()
            
            // Kirim pesan dengan reply ke pesan yang membuat dia level up
            await conn.sendMessage(m.chat, { 
                text: chating,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "System Notification",
                        body: "Congratulations!",
                        thumbnailUrl: "https://files.catbox.moe/5decnw.png",
                        sourceUrl: '',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
            
            // Kirim reaction ke pesan user
            try {
                await conn.sendMessage(m.chat, { react: { text: '🎊', key: m.key } })
            } catch (e) {}

            console.log(color(`[LEVEL UP] ${m.sender.split('@')[0]} naik ke level ${user.level}`, 'pink'))
        }
        
        return true
    }
}