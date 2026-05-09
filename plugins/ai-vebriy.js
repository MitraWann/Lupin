/**
 * Nama Plugin: Vebriy AI (Conversational Memory)
 * Deskripsi: AI Cerdas dengan memori percakapan, auto-reply WITA, & Filter Markdown.
 * Author: Senior WhatsApp Bot Developer
 */

const fetch = require('node-fetch');
const moment = require('moment-timezone');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender];
    
    // Inisialisasi properti database pengguna jika belum ada
    if (typeof user.vebriy !== 'boolean') user.vebriy = false;
    if (!Array.isArray(user.vebriy_history)) user.vebriy_history = [];

    // Jika dipanggil tanpa argumen, tampilkan panduan
    if (!text) {
        let caption = `🤖 *VEBRIY AI - SMART ASSISTANT*\n\n`;
        caption += `Status Auto-Reply: *${user.vebriy ? '🟢 ON' : '🔴 OFF'}*\n\n`;
        caption += `*Panduan Penggunaan:*\n`;
        caption += `• *${usedPrefix}${command} on* ➔ Aktifkan mode balas otomatis (Cukup reply pesan bot untuk ngobrol).\n`;
        caption += `• *${usedPrefix}${command} off* ➔ Matikan mode balas otomatis.\n`;
        caption += `• *${usedPrefix}${command} clear* ➔ Hapus memori percakapan kamu dengan AI.\n`;
        caption += `• *${usedPrefix}${command} <pertanyaan>* ➔ Bertanya langsung ke AI.\n\n`;
        caption += `_💡 AI ini memiliki fitur memori, sehingga ia akan mengingat konteks obrolan kamu sebelumnya._`;
        return m.reply(caption);
    }

    let cmd = text.toLowerCase().trim();

    // Saklar dan Pengaturan
    if (cmd === 'on') {
        user.vebriy = true;
        return m.reply(`✅ *Vebriy AI diaktifkan!*\nSekarang kamu tidak perlu mengetik command lagi. Cukup *reply/balas* pesan dari bot untuk melanjutkan obrolan.`);
    }
    if (cmd === 'off') {
        user.vebriy = false;
        return m.reply(`❌ *Vebriy AI dimatikan!*`);
    }
    if (cmd === 'clear') {
        user.vebriy_history = [];
        return m.reply(`🧹 *Memori dibersihkan!*\nVebriy AI telah melupakan riwayat obrolan kita sebelumnya.`);
    }

    // Jika bukan pengaturan, proses sebagai pertanyaan
    await handleVebriy(m, text, user, conn);
};

// ==========================================
// AUTO-REPLY LISTENER (HOOK)
// ==========================================
handler.before = async function (m, { conn }) {
    let user = global.db.data.users[m.sender];
    
    // Validasi: Pastikan fitur menyala, bukan pesan dari bot sendiri, dan berupa teks
    if (!user || !user.vebriy || m.isBaileys || m.fromMe || !m.text) return false;
    
    // Memastikan user me-reply pesan dari bot
    if (m.quoted && m.quoted.sender === conn.user.jid) {
        // Abaikan jika pesan diawali prefix (agar tidak menimpa command lain)
        let isCommand = /^[.#!/?]/i.test(m.text);
        if (!isCommand) {
            await handleVebriy(m, m.text, user, conn);
            return true; // Hentikan eksekusi command lain jika ini adalah obrolan Vebriy
        }
    }
    return false;
};

// ==========================================
// CORE PROCESSING AI
// ==========================================
async function handleVebriy(m, text, user, conn) {
    if (!Array.isArray(user.vebriy_history)) user.vebriy_history = [];

    // Ambil waktu realtime area Makassar / Kendari (WITA)
    let waktuWITA = moment().tz('Asia/Makassar').format('dddd, DD MMMM YYYY HH:mm:ss [WITA]');
    
    // System prompt untuk mengontrol behavior AI
    let systemPrompt = `Kamu adalah Vebriy. Jawab setiap pertanyaan menggunakan bahasa Indonesia yang natural dan relevan.`;

    // Merangkai histori percakapan sebelumnya untuk ingatan AI
    let memoryStr = user.vebriy_history.map(v => `${v.role === 'user' ? 'User' : 'Vebriy'}: ${v.text}`).join('\n');
    
    // Build Payload: Gabungkan Memori + Pertanyaan Saat Ini
    let fullPrompt = text;
    if (memoryStr.length > 0) {
        fullPrompt = `[Riwayat Percakapan Sebelumnya]\n${memoryStr}\n\n[Pertanyaan Saat Ini]\nUser: ${text}`;
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        // Request ke API yang telah ditentukan
        let apiUrl = `https://api.shinzu.web.id/api/ai-chat/gemini?prompt=${encodeURIComponent(fullPrompt)}&system=${encodeURIComponent(systemPrompt)}`;
        let response = await fetch(apiUrl);
        let result = await response.json();

        // Validasi respon JSON
        if (!result.status || !result.data || !result.data.response) {
            throw new Error('Invalid API Response');
        }

        let aiReply = result.data.response;

        // ==========================================
        // FILTER MARKDOWN AI -> WHATSAPP NATIVE BOLD
        // ==========================================
        // Mengubah **teks** menjadi *teks* agar valid sebagai bold di WhatsApp
        aiReply = aiReply.replace(/\*\*/g, '*');

        // Simpan input dan output ke dalam memori database user
        user.vebriy_history.push({ role: 'user', text: text });
        user.vebriy_history.push({ role: 'bot', text: aiReply });

        // Manajemen limit memori agar URL request tidak terlalu panjang/kebesaran Payload (Simpan max 10 chat terakhir / 5 pasang)
        if (user.vebriy_history.length > 10) {
            user.vebriy_history = user.vebriy_history.slice(user.vebriy_history.length - 10);
        }

        // Kirim hasil jawaban
        await m.reply(aiReply);
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`⚠️ *Terjadi Kesalahan*\nSistem Vebriy AI saat ini sedang mengalami gangguan saat mencoba mengambil respon. Coba lagi nanti.`);
    }
}

// ==========================================
// METADATA PLUGIN
// ==========================================
handler.help = ['vebriy <pertanyaan>', 'vebriy on', 'vebriy off', 'vebriy clear'];
handler.tags = ['ai'];
handler.command = /^(vebriy)$/i;
handler.owner = true;

module.exports = handler;