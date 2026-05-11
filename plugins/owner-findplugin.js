let fs = require('fs')
let path = require('path')

// IMPOR HELPER DARI LIBRARY BARU
const { sendButton, extractPayload } = require('../lib/nativeFlow')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // ==========================================
    // PERBAIKAN: FORMAT ERROR
    // ==========================================
    if (!text) {
        return m.reply(
            `⚠️ *Format Salah!*\n\n` +
            `Masukkan keyword nama file plugin yang ingin Anda cari!\n*Format: ${usedPrefix + command} <keyword>*\n\n` +
            `*Contoh Penggunaan:*\n` +
            `> ${usedPrefix + command} profile\n` +
            `> ${usedPrefix + command} menu`
        )
    }

    // ==========================================
    // LOGIKA PENCARIAN FILE
    // ==========================================
    let query = text.toLowerCase().trim()
    
    // Langsung membaca isi dari folder 'plugins'
    let pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'))
    
    // Menyaring file yang namanya mengandung kata kunci pencarian
    let results = pluginFiles.filter(file => file.toLowerCase().includes(query))

    // Jika tidak ada hasil
    if (results.length === 0) {
        return m.reply(`⛔ Tidak ditemukan file plugin dengan nama yang mengandung kata *"${query}"*.`)
    }

    // ==========================================
    // PERAKITAN DATA BUTTON
    // ==========================================
    let txt = `🔍 *HASIL PENCARIAN FILE PLUGIN* 🔍\n\n` +
               `> ⌨️ *Kata Kunci:* ${query}\n` +
               `> 📂 *Ditemukan:* ${results.length} file\n\n` +
               `> _Silahkan ketuk tombol "PILIH FILE" di bawah untuk melihat isi kodenya._`
               
    let limit = Math.min(30, results.length); // Membatasi max 30 baris list agar WA tidak crash
    let buttonRows = [];

    // Looping dan format hasil langsung ke dalam button
    for (let i = 0; i < limit; i++) {
        let fileName = results[i];
        
        buttonRows.push({
            title: fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName,
            description: `Klik untuk melihat source code`,
            id: `read_plugin_${fileName}` // Custom payload ID khusus untuk owner file reading
        });
    }
    
    if (results.length > 30) {
        txt += `\n\n_Catatan: Hanya menampilkan 30 hasil pertama karena batasan sistem._`
    }

    // Konfigurasi Button Type: List/Single Select
    const buttons = [
        {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: "📂 PILIH FILE",
                sections: [{
                    title: `Hasil Pencarian: ${query}`,
                    highlight_label: "Plugins",
                    rows: buttonRows
                }]
            })
        }
    ];

    try {
        // [MODIFIKASI] Pemanggilan sendButton sekarang membutuhkan parameter 'conn' di awal
        await sendButton(conn, m.chat, buttons, m, {
            content: txt.trim(),
            footer: global.wm || '© System Plugin Manager'
        });
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengirim menu interaktif. Coba lagi nanti.");
    }
}

handler.help = ['findplugin <keyword>']
handler.tags = ['owner']
handler.command = /^(findplugin|cariplugin|fp|cp)$/i
handler.owner = true 


// ==========================================
// INTERCEPTOR: Pembaca Respon Native Flow 
// ==========================================
handler.all = async function (m) {
    let conn = this; 
    
    // [MODIFIKASI] Gunakan Helper untuk Mengekstrak ID Tombol
    let params = extractPayload(m);

    // Jika pesan tombol berhasil diekstrak dan mengandung perintah "read_plugin_"
    if (params?.id && params.id.startsWith('read_plugin_')) {
        try {
            // 1. Keamanan: Cek secara eksplisit apakah pengklik adalah owner (Mencegah member nyolong klik)
            let isOwner = [conn.user?.id?.split(':')[0] + '@s.whatsapp.net', ...global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')].includes(m.sender.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
            if (!isOwner) {
                return m.reply("⛔ Hanya Owner yang diizinkan untuk melihat Source Code!");
            }

            // 2. Ekstrak nama file dan path
            let filename = params.id.replace('read_plugin_', '');
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
            
            // Regex untuk mendeteksi: 1. Comment, 2. String, 3. Quote Mark, 4. Keywords, 5. Boolean/Null, 6. Number
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
            console.error("Gagal membaca respon file plugin:", e);
        }
    }
};

module.exports = handler;