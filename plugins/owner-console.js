// Setup global interceptor (hanya berjalan sekali saat plugin pertama kali dimuat di memory)
if (!global.consoleHistory) {
    global.consoleHistory = [];
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    const captureLog = (chunk) => {
        const text = chunk.toString();
        global.consoleHistory.push(text);
        
        // Membatasi buffer maksimal 40 riwayat log terakhir agar RAM server tidak penuh
        if (global.consoleHistory.length > 40) {
            global.consoleHistory.shift();
        }
    };

    // Mencegat (Intercept) output normal
    process.stdout.write = (chunk, encoding, callback) => {
        captureLog(chunk);
        return originalStdoutWrite(chunk, encoding, callback);
    };

    // Mencegat (Intercept) output error
    process.stderr.write = (chunk, encoding, callback) => {
        captureLog(chunk);
        return originalStderrWrite(chunk, encoding, callback);
    };
}

let handler = async (m, { conn, usedPrefix, command, args }) => {
    // Fitur untuk membersihkan buffer memori
    if (args[0] === 'clear') {
        global.consoleHistory = [];
        return m.reply('✅ *Buffer riwayat console berhasil dibersihkan dari memori!*');
    }

    if (!global.consoleHistory || global.consoleHistory.length === 0) {
        return m.reply('⚠️ *Belum ada log baru di terminal sejak sistem interceptor aktif.*\nCoba gunakan beberapa fitur bot, lalu ketik perintah ini lagi.');
    }

    // Menggabungkan array log menjadi satu string
    let logs = global.consoleHistory.join('');
    
    // REGEX: Membersihkan ANSI Escape/Color Codes agar teks rapi
    let cleanLogs = logs.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

    // Membatasi panjang log untuk mencegah WA crash (aman di 10.000 karakter untuk Rich UI)
    const MAX_CHARS = 10000;
    if (cleanLogs.length > MAX_CHARS) {
        cleanLogs = cleanLogs.substring(cleanLogs.length - MAX_CHARS) + '\n\n// ... [LOG TERPOTONG: Melebihi batas aman render (10000 char)]';
    }

    // Header informasi
    const headerText = `*💻 LIVE CONSOLE LOG:*\n> Ketik *${usedPrefix + command} clear* untuk mereset riwayat log.`;

    // Karena ini adalah log terminal, kita bungkus seluruh output sebagai satu blok kode (highlightType: 0 / plain text)
    let codeBlocks = [{ highlightType: 0, codeContent: cleanLogs.trim() }];

    try {
        // Mengirimkan log menggunakan UI Rich Response ala Meta AI
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
                                    codeLanguage: "bash", // Format bahasa sebagai bash/terminal
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
        console.error("Gagal mengirim console UI:", e);
        m.reply("❌ *Gagal mengirim UI Rich Response*. Kemungkinan payload terblokir atau WhatsApp versi ini tidak mendukung.");
    }
}

handler.help = ['console', 'console clear'];
handler.tags = ['owner'];
handler.command = /^(console|getlog)$/i;

// FLAG KEAMANAN
handler.owner = true; 

module.exports = handler;