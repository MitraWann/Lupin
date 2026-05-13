const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const fetch = require('node-fetch');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let [atas, bawah] = text.split`|`
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!mime) throw `Balas gambar dengan perintah\n\n${usedPrefix + command} <${atas ? atas : 'teks atas'}>|<${bawah ? bawah : 'teks bawah'}>`
    if (!/image\/(jpe?g|png)/.test(mime)) throw `_*Mime ${mime} tidak didukung!*_`
    
    await m.reply(global.wait || 'Loading...')
    
    try {
        let img = await q.download()
        let url = await uploadImage(img)
        
        if (!url) throw 'Gagal mengunggah gambar ke server.'
        
        // Encode URI Component & handle empty space format (memegen uses '_' for space)
        let topText = encodeURIComponent(atas ? atas : '_')
        let bottomText = encodeURIComponent(bawah ? bawah : '_')
        
        let memeUrl = `https://api.memegen.link/images/custom/${topText}/${bottomText}.png?background=${url}`
        
        // Fetch gambar hasil API memegen untuk divalidasi
        let res = await fetch(memeUrl)
        if (!res.ok) throw 'API Memegen sedang down atau URL tidak valid!'
        
        let buffer = await res.buffer()
        let type = await fromBuffer(buffer)
        
        // VALIDASI CRUCIAL: Pastikan buffer benar-benar sebuah gambar, mencegah error FFMPEG
        if (!type || !/image/.test(type.mime)) {
            throw 'Hasil yang dikembalikan API bukan berupa gambar yang valid (Kemungkinan error page).'
        }
        
        // Menangani undefined variables
        let pack = global.packname || 'Sticker'
        let auth = global.author || 'Bot'
        
        await conn.sendImageAsSticker(m.chat, buffer, m, { packname: pack, author: auth })
        
    } catch (e) {
        console.error(e)
        m.reply(`⚠️ Terjadi kesalahan: ${e.message || e}`)
    }
}

handler.help = ['stickermeme <teks>|<teks>']
handler.tags = ['sticker']
handler.command = /^(stickermeme|smeme)$/i

handler.limit = true

module.exports = handler

// Helper function untuk upload gambar ke telegra.ph / botcahx API
async function uploadImage(buffer) { 
  try {
      let { ext } = await fromBuffer(buffer);
      let bodyForm = new FormData();
      bodyForm.append("file", buffer, "file." + ext);
      let res = await fetch("https://file.botcahx.eu.org/api/upload.php", {
        method: "post",
        body: bodyForm,
      });
      let data = await res.json();
      return data.result ? data.result.url : '';
  } catch (err) {
      console.error("Upload Image Error:", err)
      return null;
  }
}