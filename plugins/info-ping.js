let { performance } = require('perf_hooks')

let handler = async (m, { conn }) => {
    // Mulai menghitung waktu untuk ping
    let old = performance.now()

    // Menghitung Runtime (Uptime)
    let _muptime
    if (process.send) {
        process.send('uptime')
        _muptime = await new Promise(resolve => {
            process.once('message', resolve)
            setTimeout(resolve, 1000)
        }) * 1000
    } else {
        _muptime = process.uptime() * 1000
    }
    let muptime = clockString(_muptime)

    // Selesai menghitung waktu ping
    let neww = performance.now()
    
    // MENGUBAH PEMBULATAN MENJADI 6 ANGKA DI BELAKANG KOMA
    let speed = (neww - old).toFixed(6)

    // Desain UI Singkat dan Padat
    let txt = `🚀 *P O N G !*
────────────────────
⚡ *Speed:* \n> ${speed} ms
⏱️ *Runtime:* \n> ${muptime}`

    // Kirim balasan langsung
    await m.reply(txt)
}

handler.help = ['ping', 'speed']
handler.tags = ['info']
handler.command = /^(ping|speed|pong)$/i

module.exports = handler

// Fungsi untuk mengubah milidetik menjadi format waktu
function clockString(ms) {
    let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000)
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return `${d} Hari ${h} Jam ${m} Menit ${s} Detik`.replace(/0 Hari 0 Jam 0 Menit /g, '').replace(/0 Hari 0 Jam /g, '').replace(/0 Hari /g, '').trim()
}