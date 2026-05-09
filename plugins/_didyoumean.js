let didyoumean = require('didyoumean')
let similarity = require('similarity')

let handler = m => m

handler.before = function (m, { conn, match }) {
    let txt = (m.text || '').toLowerCase().trim();

    // Buat objek penyimpanan memori sementara jika belum ada
    conn.didyoumean = conn.didyoumean || {};

    // ==========================================
    // 1. FITUR AUTO-EXECUTE TANPA REPLY (SESSION)
    // ==========================================
    // Mengecek apakah user mengirim 'y' atau 'ya' dan memiliki sesi aktif
    if (txt === 'y' || txt === 'ya') {
        let session = conn.didyoumean[m.sender];
        if (session) {
            // Cek apakah umur sesi di bawah 30 detik (30000 ms)
            if (Date.now() - session.time < 30000) {
                // Cek otorisasi (Owner / Premium)
                let isROwner = [conn.user.jid, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
                let isPrems = isROwner || (global.db.data.users[m.sender]?.premiumTime > 0 || global.db.data.users[m.sender]?.premium);

                if (isPrems) {
                    // Memanipulasi m.text menjadi command yang direkomendasikan di memori
                    m.text = session.mean; 
                    
                    // Kirim reaksi agar terlihat bot sedang memproses
                    conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
                }
            }
            // Hapus sesi setelah ditangkap agar tidak tersangkut
            delete conn.didyoumean[m.sender];
        }
    }

    // ==========================================
    // 2. LOGIKA UTAMA: PENDETEKSI TYPO
    // ==========================================
    let text = m.text || '';
    
    // Regex spesifik untuk simbol prefix yang umum digunakan bot.
    // Jika bot Anda menggunakan awalan lain, Anda bisa menambahkannya di dalam kurung siku [...]
    let isPrefixSymbol = /^[.,!#%&\\-_+=|~?]/;

    // Jika pesan tidak diawali dengan simbol di atas (termasuk jika diawali emoji), hentikan proses
    if (!isPrefixSymbol.test(text)) return;

    // Ambil karakter pertama sebagai prefix, dan sisanya sebagai command
    let usedPrefix = text.charAt(0);
    let commandOnly = text.slice(1).trim().split(' ')[0].toLowerCase();
    
    if (!commandOnly) return;

    let validAliases = []
    let helpList = [] 

    // Mengumpulkan semua variasi perintah dari plugin
    for (let name in global.plugins) {
        let plugin = global.plugins[name]
        if (!plugin || plugin.disabled) continue

        if (plugin.help) {
            let helps = Array.isArray(plugin.help) ? plugin.help : [plugin.help]
            helps.forEach(h => {
                let cleanHelp = h.split(' ')[0].toLowerCase()
                validAliases.push(cleanHelp)
                helpList.push(cleanHelp)
            })
        }

        if (plugin.command) {
            let cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
            cmds.forEach(c => {
                if (typeof c === 'string') {
                    validAliases.push(c.toLowerCase())
                } else if (c instanceof RegExp) {
                    let str = c.toString()
                    str = str.replace(/^\/\^?\(/, '').replace(/^\/\^?/, '')
                    str = str.replace(/\)\$?\/[a-z]*$/i, '').replace(/\$?\/[a-z]*$/i, '')
                    
                    let parts = str.split('|')
                    parts.forEach(p => {
                        let clean = p.replace(/\\/g, '').trim().toLowerCase()
                        if (clean && !clean.includes('*') && !clean.includes('?')) {
                            validAliases.push(clean)
                        }
                    })
                }
            })
        }
    }

    // Jika command yang diketik valid, hentikan pencarian typo
    if (validAliases.includes(commandOnly)) return

    helpList = [...new Set(helpList)]

    let mean = didyoumean(commandOnly, helpList)
    let sim = mean ? similarity(commandOnly, mean) : 0
    let som = sim * 100

    let tag = `@${m.sender.replace(/@.+/, '')}` 
    let mentionedJid = [m.sender] 

    let teks = `⛔ *Perintah Tidak Ditemukan!*\n\nMaaf Kak ${tag}, menu *${usedPrefix + commandOnly}* tidak tersedia di dalam sistem.`

    if (mean && som >= 60) {
        teks += `\n\n*Apakah yang Anda maksud:*\n> ◦ ${usedPrefix + mean}\n> ◦ Kemiripan: ${parseInt(som)}%`

        // Tampilkan panduan eksekusi cepat HANYA kepada Owner & Premium
        let isROwner = [conn.user.jid, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
        let isPrems = isROwner || (global.db.data.users[m.sender]?.premiumTime > 0 || global.db.data.users[m.sender]?.premium);
        
        if (isPrems) {
            // Simpan perintah ke memori sementara (berlaku 30 detik)
            conn.didyoumean[m.sender] = {
                mean: usedPrefix + mean,
                time: Date.now()
            };
        }
    }

    conn.reply(m.chat, teks, m, { contextInfo: { mentionedJid } })
}

module.exports = handler