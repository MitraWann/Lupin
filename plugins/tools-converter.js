let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // Ambil pesan media yang di-reply atau media di pesan itu sendiri
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''

        // === 1. FITUR TO VIDEO (Sticker Animasi -> MP4) ===
        if (command === 'tovideo' || command === 'tomp4') {
            if (!/webp/.test(mime)) return m.reply(`Balas stiker animasi dengan perintah *${usedPrefix + command}*`)
            
            m.reply(global.wait) 
            
            let media = await q.download()
            const { webp2mp4 } = (await import('../lib/toAll.js')).default 
            
            let result = await webp2mp4(media)
            await conn.sendMessage(m.chat, { 
                video: result, 
                caption: '✅ *Berhasil dikonversi ke Video*' 
            }, { quoted: m })
        }

        // === 2. FITUR TO VN (Video/Audio -> Voice Note) ===
        else if (command === 'tovn') {
            if (!/video|audio/.test(mime)) return m.reply(`Balas video atau audio dengan perintah *${usedPrefix + command}*`)
            
            m.reply(global.wait)
            
            let media = await q.download()
            const { toVN, generateWaveform } = (await import('../lib/toAll.js')).default
            
            let audio = await toVN(media)
            let wave = await generateWaveform(audio) 
            
            await conn.sendMessage(m.chat, { 
                audio: audio, 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true, 
                waveform: Buffer.from(wave, 'base64') 
            }, { quoted: m })
        }

        // === 3. FITUR TO MP3 (Video/Audio -> MP3) ===
        else if (command === 'tomp3') {
            if (!/video|audio/.test(mime)) return m.reply(`Balas video atau audio dengan perintah *${usedPrefix + command}*`)
            
            m.reply(global.wait)
            
            let media = await q.download()
            const { toMP3 } = (await import('../lib/toAll.js')).default
            
            let audio = await toMP3(media)
            
            await conn.sendMessage(m.chat, { 
                audio: audio, 
                mimetype: 'audio/mpeg' 
            }, { quoted: m })
        }

        // === 4. FITUR TO IMG (Sticker -> Image PNG) ===
        else if (command === 'toimg' || command === 'topng') {
            if (!/webp/.test(mime)) return m.reply(`Balas stiker dengan perintah *${usedPrefix + command}*`)
            
            m.reply(global.wait)
            
            let media = await q.download()
            const { toIMG } = (await import('../lib/toAll.js')).default
            
            let image = await toIMG(media)
            
            await conn.sendMessage(m.chat, { 
                image: image, 
                caption: '✅ *Berhasil dikonversi ke Gambar*' 
            }, { quoted: m })
        }

    } catch (e) {
        console.error(e)
        m.reply(global.eror) 
    }
}

handler.help = ['tovn', 'tomp3', 'tovideo', 'toimg']
handler.tags = ['tools']
// Regex command diperbarui agar toimg dan topng terdeteksi
handler.command = /^(tovn|tomp3|tomp4|tovideo|toimg|topng)$/i

handler.limit = true 

module.exports = handler