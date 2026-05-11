let handler = async (m, { conn, args, usedPrefix, command }) => {

    // 1. Panduan penggunaan jika perintah kosong

    if (args.length === 0) {

        return m.reply(`⏱️ *FITUR TIMER*\n\nGunakan format: *${usedPrefix + command} <waktu> [label]*\n\n*Contoh Penggunaan:*\n${usedPrefix + command} 3m Rebus Indomie\n${usedPrefix + command} 1h Meeting zoom\n${usedPrefix + command} 30s Cek oven\n\n*Keterangan Waktu:*\n*s* = detik (seconds)\n*m* = menit (minutes)\n*h* = jam (hours)`);

    }

    let timeInput = args[0].toLowerCase();

    

    // 2. Mengambil sisa teks sebagai label/judul (Jika kosong, diberi default 'Waktu Habis!')

    let label = args.slice(1).join(' ') || 'sekarang';

    let ms = 0;

    // 3. Konversi format teks (s/m/h) menjadi Milidetik (ms)

    if (timeInput.endsWith('s')) {

        ms = parseInt(timeInput) * 1000;

    } else if (timeInput.endsWith('m')) {

        ms = parseInt(timeInput) * 60000;

    } else if (timeInput.endsWith('h')) {

        ms = parseInt(timeInput) * 3600000;

    } else {

        return m.reply(`⚠️ Format waktu salah!\nPastikan menggunakan akhiran *s*, *m*, atau *h* menempel dengan angka.\n*Contoh:* 10m`);

    }

    // Validasi jika user iseng memasukkan huruf bukan angka (misal: "am")

    if (isNaN(ms) || ms <= 0) {

        return m.reply('⚠️ Masukkan angka waktu yang valid!');

    }

    // 4. Balasan awal saat timer dimulai

    m.reply(`⏱️ *TIMER DIAKTIFKAN*\n\nDurasi: *${timeInput}*\nLabel: ${label}\n\n_Bot akan men-tag Anda saat waktu habis!_`);

// 5. Eksekusi Timer di belakang layar
    setTimeout(() => {
        // 1. Pastikan tag tertulis dengan format @nomor
        let tag = `@${m.sender.split('@')[0]}`;
        let pesanAlarm = `⏰ *BEEP BEEP BEEP!* ⏰\n\nHalo ${tag}, waktu *${timeInput}* untuk *${label}* telah habis!`;
        
        // 2. Eksekusi menggunakan sendMessage dengan parameter ganda
        conn.sendMessage(m.chat, { 
            text: pesanAlarm, 
            // Tembakan pertama: standar Baileys
            mentions: [m.sender],
            // Tembakan kedua: standar contextInfo
            contextInfo: { 
                mentionedJid: [m.sender] 
            }
        }, { quoted: m });
        
    }, ms);

}

handler.help = ['timer <waktu> [label]'];

handler.tags = ['tools']; // Akan otomatis masuk ke menu Tools berkat mesin pencetak menu Anda!

handler.command = /^(timer|countdown)$/i;

// handler.limit = true; // Hapus tanda // di depan jika ingin timer ini menguras limit user

module.exports = handler;

