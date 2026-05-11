/**
 * Plugin: Status Interaction
 * Berdasarkan payload protobuf untuk merespon elemen spesifik pada Status WhatsApp.
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`*Format Penggunaan Salah!*\n\nSilakan pilih tipe interaksi status:\n1. *qa* (Menjawab fitur stiker pertanyaan di status)\n2. *sticker* (Berinteraksi dengan stiker di status)\n3. *notify* (Mengirim notifikasi status)\n\n*Contoh penggunaan:*\n${usedPrefix + command} qa|Halo, ini jawaban saya\n${usedPrefix + command} sticker\n${usedPrefix + command} notify\n\n_Catatan: Fitur ini bekerja maksimal jika kamu me-reply/quote sebuah status WhatsApp._`);
    }

    // Memisahkan input untuk mengambil tipe dan kustom teks (jika ada)
    let [type, ...args] = text.split('|');
    let customText = args.join('|') || "Respondiendo a tu pregunta en el estado...";
    let msgContent;

    // Untuk interaksi status, kita membutuhkan "key" dari status yang dituju.
    // Jika user me-reply sebuah status, kita ambil key-nya. Jika tidak, fallback ke key pesan saat ini.
    let targetKey = m.quoted ? m.quoted.fakeObj.key : m.key;

    // Logika switch-case berdasarkan tangkapan layar yang diberikan
    switch (type.toLowerCase().trim()) {
        case "qa":
        case "status_qa":
            msgContent = {
                statusQuestionAnswerMessage: {
                    key: targetKey,
                    text: customText
                }
            };
            break;

        case "sticker":
        case "status_sticker":
            msgContent = {
                statusStickerInteractionMessage: {
                    key: targetKey,
                    stickerKey: "STICKER_123", // Pada skenario nyata, ini harusnya berisi hash spesifik dari stiker
                    type: 1
                }
            };
            break;

        case "notify":
        case "status_notify":
            msgContent = {
                statusNotificationMessage: {
                    responseMessageKey: m.key,
                    originalMessageKey: targetKey,
                    type: 1
                }
            };
            break;

        default:
            return m.reply(`Tipe interaksi tidak dikenal!\n\nSilakan gunakan: *qa*, *sticker*, atau *notify*.`);
    }

    try {
        // Mengirimkan indikator loading
        m.reply(global.wait);

        // Eksekusi payload menembus koneksi WebSocket Baileys
        await conn.relayMessage(m.chat, msgContent, {
            // Gunakan messageId untuk menghindari tabrakan ID
            messageId: m.key.id 
        });

    } catch (err) {
        console.error('Error saat merelay status interaction:', err);
        m.reply(global.eror);
    }
}

handler.help = ['statusinteract <tipe>']
handler.tags = ['tools']
handler.command = /^(statusinteract|sinteract)$/i

// Flag keamanan: Mengingat ini fungsi reverse-engineering API, direkomendasikan diberi flag owner/premium
handler.premium = true 
handler.owner = false

module.exports = handler