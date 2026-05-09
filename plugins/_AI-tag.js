/**
 * Nama Plugin: AI Tag Ultimate (Gemini Brain + User Capabilities)
 * Deskripsi: Bot merespon saat di-tag di grup, membaca profil, jadwal, persona, & memiliki memori.
 * Author: Senior WhatsApp Bot Developer
 */

const fetch = require('node-fetch'); // Sesuai requirement scraping/networking
const fs = require('fs');
const path = require('path');

let handler = async (m, { conn, text, command }) => {
    // Kosong: Plugin ini berjalan di background (handler.before)
};

handler.before = async (m, { conn }) => {
    try {
        if (!m.isGroup) return; // Hanya aktif di grup
        
        // Inisialisasi Database Sesi & Anti-Spam
        conn.selfai = conn.selfai || {};
        conn.aiLock = conn.aiLock || {}; 

        // Hindari merespon pesan dari bot itu sendiri
        if (m.isBaileys && m.fromMe) return;

        // Cek apakah pesan menge-tag/mention bot
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            const botNumber = conn.user.jid.split('@')[0];
            
            const isMention = m.mentionedJid.some(mentioned => 
                mentioned.includes(botNumber)
            );
            
            if (isMention) {
                // Hapus nomor bot dari teks input
                const filter = m.text.replace(/@\d+/g, '').trim();
                
                // ==========================================
                // FITUR 1: RESET MEMORI (/reset)
                // ==========================================
                if (filter.toLowerCase() === '/reset') {
                    delete conn.selfai[m.sender];
                    await m.reply('✅ Memori percakapan AI untukmu di grup ini berhasil dihapus/reset.');
                    return true;
                }

                // ==========================================
                // FITUR 2: SAPAAN KOSONG
                // ==========================================
                if (!filter) {
                    const empty_response = [
                        `Ada yang bisa saya bantu, ${m.name}?`,
                        `Hai ${m.name}, silakan beritahu saya apa yang Anda butuhkan.`,
                        `${m.name}, saya siap membantu. Ada pertanyaan?`,
                        `Apa yang ingin kamu diskusikan, ${m.name}?`
                    ];
                    
                    const _response_pattern = empty_response[Math.floor(Math.random() * empty_response.length)];
                    await conn.sendMessage(m.chat, { react: { text: '👋', key: m.key } });
                    await m.reply(_response_pattern);
                    return true;
                }

                // Jangan respon jika pesan diawali prefix bot (agar tidak bentrok dengan command lain)
                if (/^[.#!/\\]/.test(filter)) return;

                // 🛡️ AKTIFKAN GEMBOK ANTI-SPAM
                if (conn.aiLock[m.sender]) return true; 
                conn.aiLock[m.sender] = true;

                try {
                    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
                    await conn.sendPresenceUpdate('composing', m.chat);

                    // ==========================================
                    // 🧠 CORE 1: PENGAMBILAN DATA USER & JADWAL
                    // ==========================================
                    let userDb = global.db.data.users[m.sender] || {};
                    
                    // A. Waktu Realtime (WITA)
                    let nowMs = Date.now();
                    let tzOpt = { timeZone: "Asia/Makassar", dateStyle: "full", timeStyle: "short" };
                    let waktuSekarang = new Date(nowMs).toLocaleString("id-ID", tzOpt);

                    // B. Data Pengingat/Jadwal
                    let pengingat = userDb.pengingat || [];
                    let teksPengingat = "Saat ini User TIDAK memiliki jadwal pengingat.";

                    if (pengingat.length > 0) {
                        teksPengingat = "Berikut adalah daftar jadwal User saat ini:\n";
                        pengingat.forEach((p, i) => {
                            let dateStr = new Date(p.waktu).toLocaleString("id-ID", tzOpt);
                            let status = p.status === 0 ? 'Aktif' : 'Sudah lewat';
                            teksPengingat += `${i + 1}. Pesan: "${p.pesan}" | Waktu: ${dateStr} WITA | Status: ${status}\n`;
                        });
                    }

                    // C. Profil User
                    let infoProfil = "";
                    if (userDb.registered) {
                        infoProfil = `Nama: ${userDb.name}\nUmur: ${userDb.age} tahun.`;
                    } else {
                        infoProfil = `User ini belum mendaftar di database bot. Arahkan user untuk daftar menggunakan perintah .daftar nama.umur (misal: .daftar Budi.18)`;
                    }

                    // ==========================================
                    // 🧠 CORE 2: INJEKSI PERSONA & SYSTEM PROMPT
                    // ==========================================
                    let filePersona = path.join(process.cwd(), 'persona.txt');
                    let systemPrompt = "Kamu adalah Wann, AI cerdas yang ramah."; // Fallback

                    try {
                        let teksMentah = fs.readFileSync(filePersona, 'utf-8');
                        systemPrompt = teksMentah
                            .split('{WAKTU_SEKARANG}').join(waktuSekarang)
                            .split('{TEKS_PENGINGAT}').join(teksPengingat)
                            .split('{INFO_PROFIL}').join(infoProfil);
                    } catch (err) {
                        // Fallback jika file persona.txt tidak ditemukan
                        systemPrompt = `Kamu adalah Wann. Waktu saat ini: ${waktuSekarang} WITA. ${teksPengingat}\n\n[INFO PROFIL USER]:\n${infoProfil}\n\nSaat ini kamu berada di Grup WhatsApp.`;
                    }

                    // ==========================================
                    // 🧠 CORE 3: MANAJEMEN MEMORI (CONVERSATIONAL)
                    // ==========================================
                    if (!conn.selfai[m.sender]) {
                        conn.selfai[m.sender] = { sessionChat: [] };
                    }
                    let memoryArray = conn.selfai[m.sender].sessionChat;
                    
                    // Merangkai ingatan sebelumnya menjadi string
                    let memoryStr = memoryArray.map(v => `${v.role === 'user' ? 'User' : 'Wann'}: ${v.text}`).join('\n');
                    
                    // Bangun Payload Akhir
                    let fullPrompt = filter;
                    if (memoryStr.length > 0) {
                        fullPrompt = `[Riwayat Percakapan Sebelumnya]\n${memoryStr}\n\n[Pertanyaan Saat Ini]\nUser: ${filter}`;
                    } else {
                        // Trik Injeksi Waktu untuk chat pertama
                        fullPrompt = `[Info Waktu: ${waktuSekarang} WITA]\nUser: ${filter}`;
                    }

                    // ==========================================
                    // 🧠 CORE 4: HIT API GEMINI (AI-VEBRIY BRAIN)
                    // ==========================================
                    let apiUrl = `https://api.shinzu.web.id/api/ai-chat/gemini?prompt=${encodeURIComponent(fullPrompt)}&system=${encodeURIComponent(systemPrompt)}`;
                    
                    let response = await fetch(apiUrl);
                    let result = await response.json();

                    if (!result.status || !result.data || !result.data.response) {
                        throw new Error('Invalid API Response from Gemini Endpoint');
                    }

                    let aiReply = result.data.response;

                    // Filter Markdown agar sesuai dengan native WhatsApp Bold
                    aiReply = aiReply.replace(/\*\*/g, '*');

                    // ==========================================
                    // 🧠 CORE 5: SIMPAN MEMORI & RESPONSE
                    // ==========================================
                    memoryArray.push({ role: 'user', text: filter });
                    memoryArray.push({ role: 'bot', text: aiReply });

                    // Batasi memori maksimal 10 interaksi terakhir (5 pasang) agar payload tidak membengkak
                    if (memoryArray.length > 10) {
                        conn.selfai[m.sender].sessionChat = memoryArray.slice(memoryArray.length - 10);
                    }

                    // Kirim Balasan
                    await m.reply(aiReply);
                    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                } catch (e) {
                    console.error('AI Tag Error:', e);
                    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    m.reply("⚠️ Maaf, Wann sedang kesulitan memproses data. Silakan balas pesan ini dengan /reset untuk memulai ulang sesi.");
                } finally {
                    // 🔓 BUKA GEMBOK ANTI-SPAM
                    delete conn.aiLock[m.sender];
                }
                return true;
            }
        }
        return true;
    } catch (error) {
        console.error('Fatal Handler Error:', error);
        return true;
    }
};

module.exports = handler;