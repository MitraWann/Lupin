/**
 * Nama Plugin: DeepAI Chatbot (Continuous)
 * Deskripsi: Chatbot AI dengan scraper DeepAI, mendukung riwayat obrolan (memory).
 * Dependency: axios, form-data, uuid (Pastikan sudah terinstall di package.json)
 */

const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");

// ==========================================
// CORE SCRAPER DEEPAI
// ==========================================
const UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
];

function getUA() {
    return UAS[Math.floor(Math.random() * UAS.length)];
}

function getHeaders(form) {
    return {
        ...form.getHeaders(),
        "api-key": "tryit-61180926040-f45718959fea9f0a04999506c579a399",
        "user-agent": getUA(),
        "origin": "https://deepai.org",
        "referer": "https://deepai.org/",
        "accept": "*/*",
        "accept-language": Math.random() > 0.5 ? "en-US,en;q=0.9" : "id-ID,id;q=0.9,en;q=0.8",
        "sec-ch-ua": `"Chromium";v="${130 + Math.floor(Math.random() * 5)}", "Not:A-Brand";v="24"`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": `"Windows"`,
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty"
    };
}

async function sendChat(message, session) {
    const form = new FormData();

    form.append("chat_style", "claudeai_0"); // Style AI
    form.append("chatHistory", JSON.stringify(session.history));
    form.append("model", "standard");
    form.append("session_uuid", session.id);
    form.append("sensitivity_request_id", uuidv4());
    form.append("hacker_is_stinky", "very_stinky");
    form.append("enabled_tools", JSON.stringify(["image_generator", "image_editor"]));

    const { data } = await axios.post(
        "https://api.deepai.org/hacking_is_a_serious_crime",
        form,
        {
            headers: getHeaders(form),
            timeout: 20000,
            validateStatus: () => true
        }
    );

    if (!data) throw "Tidak ada respon dari server DeepAI";

    return data;
}

async function chatDeepAI(session, text) {
    // Push prompt user ke history
    session.history.push({ role: "user", content: text });

    const res = await sendChat(text, session);

    let reply = "";
    if (typeof res === "string") reply = res;
    else if (res.output) reply = res.output;
    else if (res.response) reply = res.response;
    else reply = JSON.stringify(res);

    // Push balasan AI ke history
    session.history.push({ role: "assistant", content: reply });

    // Limit history agar tidak terlalu panjang (max 15 interaksi terakhir untuk menghemat memori)
    if (session.history.length > 15) {
        session.history = session.history.slice(-15);
    }

    return reply;
}

async function retryChat(session, text, max = 3) {
    let err;
    for (let i = 0; i < max; i++) {
        try {
            return await chatDeepAI(session, text);
        } catch (e) {
            err = e;
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
        }
    }
    throw err;
}

// ==========================================
// PLUGIN HANDLER
// ==========================================
let handler = async (m, { conn, text, usedPrefix, command, args, isOwner, isAdmin, isPrems }) => {
    // 1. Validasi Input
    if (!text) {
        let caption = `⚠️ *Format salah!*\n\nHarap masukkan teks pertanyaan.\n\n*Contoh:*\n${usedPrefix}${command} Siapa penemu lampu?\n\n*Catatan:*\nAI ini dapat mengingat percakapan sebelumnya. Ketik *${usedPrefix}${command} reset* untuk mereset riwayat obrolan Anda.`;
        return m.reply(caption);
    }

    let user = global.db.data.users[m.sender];

    // 2. Fitur Reset Sesi
    if (text.toLowerCase() === 'reset') {
        user.deepaiSession = {
            id: uuidv4(),
            history: []
        };
        return m.reply('✅ *Riwayat obrolan berhasil dihapus!*\nSesi DeepAI Anda telah direset. Mari mulai topik baru.');
    }

    // 3. Inisialisasi Sesi jika belum ada
    if (!user.deepaiSession || !user.deepaiSession.id) {
        user.deepaiSession = {
            id: uuidv4(),
            history: []
        };
    }

    // 4. Proses Loading
    await m.reply(global.wait);

    // 5. Eksekusi Scraper dengan Try-Catch
    try {
        let result = await retryChat(user.deepaiSession, text);
        
        // Kirim balasan ke user
        await m.reply(result);
        
    } catch (e) {
        console.error('[DeepAI Error]:', e);
        m.reply(global.eror + '\n\n*Detail Error:* Server DeepAI sedang sibuk atau memblokir request.');
    }
};

// ==========================================
// METADATA PLUGIN
// ==========================================
handler.help = ['deepai'].map(v => v + ' <teks>');
handler.tags = ['ai', 'internet'];
handler.command = /^(deepai)$/i;

// Keamanan & Ekonomi
handler.limit = true; // Mengurangi limit user karena menggunakan resource
handler.register = true; // Pastikan user sudah terdaftar di database

module.exports = handler;