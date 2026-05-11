const fs = require('fs')
const path = require('path')

// IMPOR HELPER DARI LIBRARY BARU
const { sendButton, extractPayload } = require('../lib/nativeFlow')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `Masukkan nama command yang ingin dicari nama file-nya.\n*Format: ${usedPrefix + command} <cmd>*\n\n` +
            `*Contoh Penggunaan:*\n` +
            `> ${usedPrefix + command} ban\n` +
            `> ${usedPrefix + command} menu`
        )
    }

    let plugins = global.plugins
    let matches = []

    for (let filename in plugins) {
        let plugin = plugins[filename]
        if (!plugin) continue 

        let isMatch = false
        
        // 1. Cek di handler.command
        if (plugin.command) {
            if (plugin.command instanceof RegExp) {
                let regexStr = plugin.command.toString()
                // Abaikan Regex kosong bawaan (formalitas) yang bikin bug
                if (regexStr !== '/(?:)/' && regexStr !== '/(?:)/i') {
                    if (plugin.command.test(text) || regexStr.toLowerCase().includes(text.toLowerCase())) {
                        isMatch = true
                    }
                }
            } else if (typeof plugin.command === 'string') {
                if (plugin.command.toLowerCase().includes(text.toLowerCase())) isMatch = true
            } else if (Array.isArray(plugin.command)) {
                if (plugin.command.some(cmd => cmd.toLowerCase().includes(text.toLowerCase()))) isMatch = true
            }
        }

        // 2. Cek juga di handler.customPrefix (Untuk file seperti _salambot.js atau owner-exec.js)
        if (!isMatch && plugin.customPrefix) {
            if (plugin.customPrefix instanceof RegExp) {
                if (plugin.customPrefix.test(text) || plugin.customPrefix.toString().toLowerCase().includes(text.toLowerCase())) {
                    isMatch = true
                }
            } else if (typeof plugin.customPrefix === 'string') {
                if (plugin.customPrefix.toLowerCase().includes(text.toLowerCase())) isMatch = true
            }
        }

        // Jika cocok di command atau customPrefix, masukkan ke daftar
        if (isMatch) {
            matches.push(filename)
        }
    }

    if (matches.length === 0) {
        return m.reply(`❌ Tidak ditemukan file plugin dengan command atau prefix *"${text}"*.`)
    }

    // ==========================================
    // PERAKITAN DATA BUTTON
    // ==========================================
    let txt = `🔎 *HASIL PENCARIAN COMMAND* 🔎\n\n` +
               `> ⌨️ *Kata Kunci:* ${text}\n` +
               `> 📂 *Ditemukan:* ${matches.length} file\n\n` +
               `> _Silahkan ketuk tombol "PILIH FILE" di bawah untuk melihat isi kodenya._`

    let limit = Math.min(30, matches.length); // Membatasi max 30 baris list agar WA tidak crash
    let buttonRows = [];

    // Looping dan format hasil langsung ke dalam button
    for (let i = 0; i < limit; i++) {
        let fileName = matches[i];
        
        buttonRows.push({
            title: fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName,
            description: `Klik untuk melihat source code`,
            id: `read_cmd_${fileName}` // Custom payload ID khusus untuk owner file reading
        });
    }

    if (matches.length > 30) {
        txt += `\n\n_Catatan: Hanya menampilkan 30 hasil pertama karena batasan sistem._`
    }

    // Konfigurasi Button Type: List/Single Select
    const buttons = [
        {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: "📂 PILIH FILE",
                sections: [{
                    title: `Pencarian Command: ${text}`,
                    rows: buttonRows
                }]
            })
        }
    ];

    try {
        await sendButton(conn, m.chat, buttons, m, {
            content: txt.trim(),
            footer: global.wm || '© System Plugin Manager'
        });
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengirim menu interaktif. Coba lagi nanti.");
    }
}

handler.help = ['findcmd <cmd>']
handler.tags = ['owner']
handler.command = /^(findcmd|fc|caricmd)$/i
handler.owner = true

// ==========================================
// INTERCEPTOR: Pembaca Respon Native Flow 
// ==========================================
handler.all = async function (m) {
    let conn = this; 
    
    // Gunakan Helper untuk Mengekstrak ID Tombol
    let params = extractPayload(m);

    // Jika pesan tombol berhasil diekstrak dan mengandung perintah "read_cmd_"
    if (params?.id && params.id.startsWith('read_cmd_')) {
        try {
            // 1. Keamanan: Cek secara eksplisit apakah pengklik adalah owner (Mencegah member nyolong klik)
            let isOwner = [conn.user?.id?.split(':')[0] + '@s.whatsapp.net', ...global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')].includes(m.sender.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
            if (!isOwner) {
                return m.reply("⛔ Hanya Owner yang diizinkan untuk melihat Source Code!");
            }

            // 2. Ekstrak nama file dan path
            let filename = params.id.replace('read_cmd_', '');
            let filePath = path.join('./plugins', filename);

            // 3. Validasi Keberadaan File
            if (!fs.existsSync(filePath)) {
                return m.reply(`⚠️ File \`${filename}\` sudah tidak ditemukan di folder plugins.`);
            }

            // 4. Kirimkan Source Code (Menggunakan UI Rich Response / Clean Code Meta AI)
            let codeContent = fs.readFileSync(filePath, 'utf-8');
            let fileSize = fs.statSync(filePath).size; 

            // Batasi panjang karakter untuk mencegah error payload WA (array object terlalu besar)
            const MAX_CHARS = 80000;
            if (codeContent.length > MAX_CHARS) {
                codeContent = codeContent.substring(0, MAX_CHARS) + '\n\n// ... [KODE TERPOTONG: Melebihi batas aman render syntax highlighter UI WA (80000 char)]';
            }
            
            const headerText = `*🧩 Plugin :* ${filename}\n*🗃️ Ukuran :* ${(fileSize / 1024).toFixed(2)} KB`;

            // Tokenizer Sederhana untuk Syntax Highlighting
            let codeBlocks = [];
            let lastIndex = 0;
            let match;
            
            // Regex untuk mendeteksi berbagai token JS
            const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|((["'`])(?:\\.|[^\\])*?\3)|\b(let|const|var|function|async|await|return|if|else|for|while|class|import|export|from|try|catch|new|this|typeof|instanceof|switch|case|break|continue|default|throw|delete|yield)\b|\b(true|false|null|undefined|NaN)\b|\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g;

            while ((match = tokenRegex.exec(codeContent)) !== null) {
                if (match.index > lastIndex) {
                    codeBlocks.push({ highlightType: 0, codeContent: codeContent.substring(lastIndex, match.index) });
                }

                if (match[1]) codeBlocks.push({ highlightType: 4, codeContent: match[0] }); 
                else if (match[2]) codeBlocks.push({ highlightType: 2, codeContent: match[0] });
                else if (match[4]) codeBlocks.push({ highlightType: 1, codeContent: match[0] }); 
                else if (match[5] || match[6]) codeBlocks.push({ highlightType: 3, codeContent: match[0] }); 
                
                lastIndex = tokenRegex.lastIndex;
            }

            if (lastIndex < codeContent.length) {
                codeBlocks.push({ highlightType: 0, codeContent: codeContent.substring(lastIndex) });
            }

            // Mengeksekusi relayMessage menggunakan raw payload dari Meta AI
            await conn.relayMessage(m.chat, {
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            submessages: [
                                {
                                    messageType: 2,
                                    messageText: headerText
                                },
                                {
                                    messageType: 5,
                                    codeMetadata: {
                                        codeLanguage: "javascript",
                                        codeBlocks: codeBlocks
                                    }
                                }
                            ],
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedAiBotMessageInfo: { botJid: "867051314767696@s.whatsapp.net" },
                                forwardOrigin: 4
                            }
                        }
                    }
                }
            }, { 
                quoted: m, 
                messageId: conn.generateMessageTag ? conn.generateMessageTag() : m.key.id 
            });

        } catch (e) {
            console.error("Gagal membaca respon file plugin (findcmd):", e);
        }
    }
};

module.exports = handler;