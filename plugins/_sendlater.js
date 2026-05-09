let handler = m => m;

handler.before = async function (m, { conn }) {
    // 1. Membersihkan timer lama jika file ini di-reload (Anti-Crash)
    if (conn.sendLaterWatcher) clearInterval(conn.sendLaterWatcher);

    // 2. Menyalakan Mesin CCTV Internal yang berputar setiap 10 detik (10000 milidetik)
    conn.sendLaterWatcher = setInterval(async () => {
        
        // Mencegah error jika database utama belum siap termuat saat bot baru menyala
        if (!global.db || !global.db.data) return; 
        
        global.db.data.sendlater = global.db.data.sendlater || [];
        let schedules = global.db.data.sendlater;
        
        // Jika antrean kosong, CCTV kembali tidur selama 10 detik
        if (schedules.length === 0) return;

        let now = Date.now();

        // Looping mundur (Reverse loop) untuk mengeksekusi pesan
        for (let i = schedules.length - 1; i >= 0; i--) {
            let p = schedules[i];
            
            // Jika jam bumi sudah melewati batas waktu jadwal
            if (now >= p.waktu) {
                try {
                    // Eksekusi pengiriman pesan ke target
                    await conn.sendMessage(p.jid, { text: p.pesan });
                    
                    // Laporan ke Owner
                    let laporan = `✅ *LAPORAN SISTEM*\nPesan terjadwal untuk @${p.jid.split('@')[0]} telah sukses terkirim tepat waktu!\n\n📝 Pesan: "${p.pesan}"`;
                    await conn.sendMessage(p.pengirim, { text: laporan, mentions: [p.jid] });
                    
                } catch (e) {
                    console.error(e);
                    // Laporan jika gagal (misal nomor target salah/tidak terdaftar di WA)
                    let laporanGagal = `❌ *LAPORAN SISTEM*\nPesan terjadwal untuk @${p.jid.split('@')[0]} GAGAL dikirim!\nPastikan nomor tersebut aktif di WhatsApp.`;
                    await conn.sendMessage(p.pengirim, { text: laporanGagal, mentions: [p.jid] });
                }

                // Hapus jadwal dari keranjang agar tidak dikirim ganda
                schedules.splice(i, 1);
            }
        }
    }, 10000); // Angka 10000 = 10 detik (Bisa diubah sesuai selera)

    return true;
}

module.exports = handler;