const axios = require('axios');

// IMPOR HELPER DARI LIBRARY BARU
const { sendButton, extractPayload } = require('../lib/nativeFlow');

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Inisialisasi tempat penyimpanan sesi lirik
  conn.lrcSession = conn.lrcSession || {};

  if (!text) {
    return m.reply(`Masukkan judul lagu yang ingin dicari liriknya!\n\n*Contoh:* ${usedPrefix + command} fuji kaze shinunoga e-wa`);
  }

  try {
    // Mengirim pesan loading
    m.reply(global.wait || '⏳ _Sedang mencari lirik..._');

    // Endpoint API resmi LRCLIB
    let apiUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(text)}`;
    let res = await axios.get(apiUrl);
    let data = res.data;

    // Cek apakah data ditemukan
    if (!data || data.length === 0) {
      return m.reply('❌ Lirik tidak ditemukan untuk pencarian tersebut.');
    }

    // Bersihkan sesi lama jika pengguna melakukan pencarian baru
    if (conn.lrcSession[m.sender]) clearTimeout(conn.lrcSession[m.sender].timeout);

    // Simpan hasil pencarian ke dalam session bot
    conn.lrcSession[m.sender] = {
      data: data,
      query: text,
      // Hapus sesi otomatis setelah 5 menit untuk mencegah kebocoran memori
      timeout: setTimeout(() => {
        delete conn.lrcSession[m.sender];
      }, 5 * 60 * 1000)
    };

    // ==========================================
    // PERAKITAN DATA BUTTON (Maksimal 30 Hasil)
    // ==========================================
    let txt = `🎵 *Hasil Pencarian Lirik: ${text}*\n\n`;
    txt += `> _Silahkan ketuk tombol "PILIH LAGU" di bawah untuk melihat liriknya._`;

    // Ambil maksimal 30 lagu teratas agar daftar di WA tidak crash
    let limit = Math.min(30, data.length);
    let buttonRows = [];

    for (let i = 0; i < limit; i++) {
        let song = data[i];
        let title = song.trackName || 'Tidak diketahui';
        let artist = song.artistName || 'Tidak diketahui';
        
        buttonRows.push({
            title: title.length > 50 ? title.substring(0, 47) + '...' : title, // Batas aman WA
            description: `Artis: ${artist}`.substring(0, 70), // Maksimal karakter deskripsi list WA
            id: `lrc_select_${i}` // Payload ID untuk ditangkap oleh interceptor
        });
    }

    if (data.length > 30) {
        txt += `\n\n_Catatan: Hanya menampilkan 30 hasil terbaik pencarian._`;
    }

    // Konfigurasi Button Type: List/Single Select
    const buttons = [
        {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: "🎵 PILIH LAGU",
                sections: [{
                    title: `Pencarian Lirik: ${text}`,
                    highlight_label: "Lyrics",
                    rows: buttonRows
                }]
            })
        }
    ];

    // Kirim menggunakan library
    await sendButton(conn, m.chat, buttons, m, {
        content: txt.trim(),
        footer: global.wm || '© Lyrics Finder API'
    });

  } catch (e) {
    console.error(e);
    m.reply(global.eror || '❌ Terjadi kesalahan pada server pencarian.');
  }
}

// ==========================================
// INTERCEPTOR: Pembaca Respon Native Flow 
// ==========================================
handler.all = async function (m) {
  let conn = this;
  
  // Gunakan Helper untuk Mengekstrak ID Tombol
  let params = extractPayload(m);

  // Jika pesan tombol berhasil diekstrak dan merupakan ID untuk memilih lirik
  if (params?.id && params.id.startsWith('lrc_select_')) {
      try {
          conn.lrcSession = conn.lrcSession || {};
          let session = conn.lrcSession[m.sender];

          // Validasi apakah sesi pencarian user masih ada
          if (!session || !session.data) {
              return m.reply("❌ Sesi pencarian lirik telah berakhir (lebih dari 5 menit). Silahkan lakukan pencarian ulang.");
          }

          // Ekstrak index array dari ID payload
          let index = parseInt(params.id.replace('lrc_select_', ''));
          
          if (isNaN(index) || index < 0 || index >= session.data.length) {
              return m.reply("❌ Pilihan lagu tidak valid.");
          }

          let song = session.data[index];
          let title = song.trackName || 'Tidak diketahui';
          let artist = song.artistName || 'Tidak diketahui';
          let album = song.albumName || 'Tidak diketahui';
          
          // Mengutamakan lirik tersinkronisasi (LRC) jika ada
          let lyricsText = song.syncedLyrics || song.plainLyrics;

          if (lyricsText) {
              let caption = `*Judul:* ${title}\n*Artis:* ${artist}\n*Album:* ${album}\n\n*Lirik:*\n${lyricsText}`;
              
              // Batasi ukuran teks copy untuk mencegah error payload (max 15.000 karakter)
              let copyPayload = lyricsText.length > 15000 ? lyricsText.substring(0, 15000) : lyricsText;
              
              // Merakit tombol Copy (Salin Lirik)
              const buttons = [
                  {
                      name: "cta_copy",
                      buttonParamsJson: JSON.stringify({
                          display_text: "📋 Salin Lirik",
                          copy_code: copyPayload
                      })
                  }
              ];
              
              // Kirim lirik final beserta tombol menggunakan helper sendButton
              await sendButton(conn, m.chat, buttons, m, {
                  content: caption,
                  footer: global.wm || '© Lyrics Finder API'
              });
          } else {
              m.reply(`❌ Lagu *${title}* oleh *${artist}* ditemukan, tetapi liriknya belum tersedia di database.`);
          }

          // Hapus sesi setelah pengguna berhasil memilih agar tidak memberatkan memori bot
          clearTimeout(session.timeout);
          delete conn.lrcSession[m.sender];

      } catch (e) {
          console.error("Gagal membaca respon lirik:", e);
      }
  }
};

handler.help = ['lrc <judul>'];
handler.tags = ['tools'];
handler.command = /^(lrc|lrclib|lyrics)$/i;

module.exports = handler;