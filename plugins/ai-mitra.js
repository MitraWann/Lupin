const novaAi = require('../lib/novaAi.js')
const fs = require('fs')
const path = require('path')
const util = require('util')

// Objek untuk menyimpan memori percakapan & status Auto AI
global.mitra_session = global.mitra_session || {}
global.mitra_auto_ai = global.mitra_auto_ai || {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Tentukan input teks (dari perintah atau dari chat biasa jika itu auto/reply)
    let input = text ? text.trim() : m.text.trim()

    // ==========================================
    // SAKLAR & KONTROL (ON/OFF/RESET)
    // ==========================================
    let cmd = input.toLowerCase()
    
    if (cmd === 'on' || cmd === 'enable') {
        global.mitra_auto_ai[m.sender] = true
        return m.reply("✅ *AI Mitra AKTIF!*\n\nSekarang Wann akan otomatis membalas *hanya jika kamu me-reply* pesannya.")
    }
    
    if (cmd === 'off' || cmd === 'disable') {
        delete global.mitra_auto_ai[m.sender]
        return m.reply("❌ *Auto AI Mitra MATI!*\n\nWann tidak akan merespons otomatis (walaupun di-reply), kecuali kamu memanggilnya dengan perintah `.mitra <pertanyaan>`.")
    }

    if (cmd === 'reset') {
        global.mitra_session[m.sender] = []
        return m.reply("✅ Sesi memori percakapan telah direset, Boss!")
    }

    if (!input) {
        return m.reply(
            `💬 *Halo Boss! Ada yang bisa Wann bantu?*\n\n` +
            `*Kontrol AI:*\n` +
            `> \`${usedPrefix + command} on\` : Nyalakan respons otomatis (via Reply)\n` +
            `> \`${usedPrefix + command} off\` : Matikan respons otomatis\n` +
            `> \`${usedPrefix + command} reset\` : Hapus ingatan chat`
        )
    }

    await conn.sendMessage(m.chat, { react: { text: '🤔', key: m.key } })

    try {
        //        // ==========================================
        // 1. MENGAMBIL DATABASE USER (Jadwal & Profil)
        // ==========================================
        let userDb = global.db.data.users[m.sender] || {};
        
        // A. Data Waktu (WITA)
        let nowMs = Date.now();
        let tzOpt = { timeZone: "Asia/Makassar", dateStyle: "full", timeStyle: "short" };
        let waktuSekarang = new Date(nowMs).toLocaleString("id-ID", tzOpt);

        // B. Data Pengingat/Jadwal Aktif
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

        // C. Data Profil (Nama & Umur)
        let infoProfil = "";
        if (userDb.registered) {
            infoProfil = `Nama Panggilan: ${userDb.name}\nUmur: ${userDb.age} tahun.`;
        } else {
            infoProfil = `User ini belum mendaftar di database bot. Kamu belum mengetahui nama dan umurnya. Arahkan user untuk daftar menggunakan perintah .daftar nama.umur atau .reg nama.umur`;
        }

        //        // ==========================================
        // 2. MEMBACA FILE PERSONA.TXT
        // ==========================================
        let filePersona = path.join(__dirname, '../persona.txt');
        let systemPrompt = "";

        try {
            let teksMentah = fs.readFileSync(filePersona, 'utf-8');
            systemPrompt = teksMentah
                .split('{WAKTU_SEKARANG}').join(waktuSekarang)
                .split('{TEKS_PENGINGAT}').join(teksPengingat);
            
            systemPrompt += `\n\n[INFORMASI PROFIL USER YANG SEDANG CHAT DENGANMU]:\n${infoProfil}`;
            if (m.isGroup) {
                systemPrompt += `\n\n[INFO LOKASI CHAT]: Saat ini kamu sedang mengobrol santai di dalam sebuah Grup WhatsApp.`;
            }
        } catch (err) {
            systemPrompt = `Kamu adalah Wann. Waktu saat ini: ${waktuSekarang} WITA. ${teksPengingat}\n\n[INFO PROFIL USER]:\n${infoProfil}`;
        }

        // ==========================================
        // 3. LOGIKA MEMORI/SESI
        // ==========================================
        if (!global.mitra_session[m.sender]) global.mitra_session[m.sender] = []
        let sejarah = global.mitra_session[m.sender]

        // Gabungkan System Prompt + Riwayat + Pertanyaan Baru
        let fullPrompt = `System: ${systemPrompt}\n\n`
        
        let riwayatTeks = sejarah.map(chat => `${chat.role}: ${chat.content}`).join('\n')
        let promptFinal = `${fullPrompt}${riwayatTeks}\nUser: ${input}\nAssistant:`

        //        // ==========================================
        // 4. MENGIRIM KE API (Nova AI)
        // ==========================================
        const res = await novaAi(promptFinal)
        
        // Ekstraksi jawaban cerdas Nova AI
        let answer = res.response_text || res.answer || res.text || res.reply || res.message || res.response;
        if (!answer) {
            answer = typeof res === 'string' ? res : util.format(res);
        }

        if (answer) {
            let rawAnswer = answer.trim();

            // Simpan ke Memori Sesi (Menggunakan teks asli agar AI tidak lupa struktur kode/markdown)
            sejarah.push({ role: 'User', content: input })
            sejarah.push({ role: 'Assistant', content: rawAnswer })
            
            // Batasi ingatan 10 riwayat terakhir
            if (sejarah.length > 10) sejarah.shift() 

            // Cek apakah balasan AI mengandung blok kode (```) atau tabel markdown (|---|)
            let isCode = rawAnswer.includes('```');
            let isTable = rawAnswer.includes('|') && rawAnswer.includes('---');

            if (isCode || isTable) {
                try {
                    // IMPOR LIBRARY DARI FOLDER LIB
                    // Sesuaikan 'AIRich.js' dengan nama file kamu jika berbeda!
                    const { AIRich } = require('../lib/MessageBuilder.js'); 
                    let aiMsg = new AIRich();

                    // --- MARKDOWN PARSER (State Machine) ---
                    let state = 'TEXT';
                    let currentText = '';
                    let currentCode = '';
                    let currentLang = '';
                    let currentTable = [];
                    let blocks = [];

                    const flushText = () => { 
                        if (currentText.trim()) { 
                            let clean = currentText.trim().replace(/\*/g, '').replace(/#/g, '');
                            blocks.push({ type: 'TEXT', content: clean }); 
                            currentText = ''; 
                        } 
                    };

                    const lines = rawAnswer.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];

                        if (state === 'TEXT') {
                            if (line.trim().startsWith('```')) {
                                flushText();
                                state = 'CODE';
                                currentLang = line.trim().substring(3).trim();
                            } else if (line.trim().startsWith('|') && line.trim().endsWith('|') && i + 1 < lines.length && lines[i+1].trim().startsWith('|') && /[-]{2,}/.test(lines[i+1])) {
                                // Deteksi header tabel
                                flushText();
                                state = 'TABLE';
                                currentTable.push(line);
                            } else {
                                currentText += line + '\n';
                            }
                        } else if (state === 'CODE') {
                            if (line.trim().startsWith('```')) {
                                blocks.push({ type: 'CODE', lang: currentLang || 'javascript', content: currentCode.replace(/\n$/, '') });
                                currentCode = '';
                                currentLang = '';
                                state = 'TEXT';
                            } else {
                                currentCode += line + '\n';
                            }
                        } else if (state === 'TABLE') {
                            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                                // Abaikan baris pemisah markdown tabel (|---|:--:|)
                                if (!/^\|[-:\| ]+\|$/.test(line.trim())) {
                                    currentTable.push(line);
                                }
                            } else {
                                // Akhir dari tabel, parse menjadi Matrix Array
                                let parsedTable = currentTable.map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/\*/g, '').replace(/`/g, '')));
                                blocks.push({ type: 'TABLE', content: parsedTable });
                                currentTable = [];
                                state = 'TEXT';
                                currentText += line + '\n'; // Baris ini masuk kembali ke teks
                            }
                        }
                    }

                    // Flush sisa teks di memori
                    if (state === 'TEXT') flushText();
                    else if (state === 'CODE') blocks.push({ type: 'CODE', lang: currentLang || 'javascript', content: currentCode.replace(/\n$/, '') });
                    else if (state === 'TABLE') {
                        let parsedTable = currentTable.map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/\*/g, '').replace(/`/g, '')));
                        blocks.push({ type: 'TABLE', content: parsedTable });
                    }

                    // --- RAKIT RICH RESPONSE ---
                    for (let block of blocks) {
                        if (block.type === 'TEXT') aiMsg.addText(block.content);
                        else if (block.type === 'CODE') aiMsg.addCode(block.lang, block.content);
                        else if (block.type === 'TABLE') aiMsg.addTable(block.content);
                    }

                    // Eksekusi pengiriman menggunakan antarmuka UI Rich Response
                    await aiMsg.run(m.chat, conn, m);

                } catch (err) {
                    console.error('Error saat membangun Rich Response:', err);
                    // Fallback: Jika ada error saat rendering UI, kirim sebagai teks normal
                    let cleanText = rawAnswer.replace(/\*/g, '').replace(/#/g, '');
                    await m.reply(cleanText);
                }
            } else {
                // Eksekusi fallback: Jika tidak ada kode dan tabel sama sekali, kirim sebagai teks normal
                let cleanText = rawAnswer.replace(/\*/g, '').replace(/#/g, '');
                await m.reply(cleanText);
            }

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        } else {
            throw new Error('Nova AI memberikan respon kosong.')
        }

    } catch (e) {
        console.error('Error Nova AI:', e)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        m.reply(`⚠️ Maaf Boss, AI sedang gangguan.\n\nDetail: ${e.message || e}`)
    }
}

handler.help = ['mitra on/off', 'mitra reset']
handler.tags = ['ai']
handler.command = /^(mitra|wann)$/i
handler.owner = true

//// ==========================================
// PENDETEKSI OTOMATIS (HANYA MERESPON REPLY)
// ==========================================
handler.before = async (m, { conn }) => {
    // Abaikan jika pesan diawali prefix (perintah bot biasa) atau bukan teks
    if (!m.text || /^[./!#]/.test(m.text)) return
    
    // Abaikan pesan dari bot itu sendiri
    if (m.isBaileys || m.fromMe) return

    global.mitra_auto_ai = global.mitra_auto_ai || {}
    
    // Cek status Auto AI user
    let isAutoOn = global.mitra_auto_ai[m.sender]
    
    // ATURAN 2: JIKA MITRA OFF, ABAIKAN TOTAL (Bahkan jika di-reply)
    if (!isAutoOn) return

    // ATURAN 1: JIKA MITRA ON, PASTIKAN ITU ADALAH REPLY KE PESAN BOT
    let isReplyBot = m.quoted && m.quoted.fromMe && m.quoted.text

    // Jika pesan tersebut BUKAN reply ke pesan bot, hiraukan (jangan berisik)
    if (!isReplyBot) return

    // Jika lolos (Status ON & Merupakan Reply Bot), kirim ke otak Wann
    return handler(m, { conn, text: m.text, usedPrefix: '.', command: 'mitra' })
}

module.exports = handler