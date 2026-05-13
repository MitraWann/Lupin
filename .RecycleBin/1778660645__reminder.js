let handler = m => m;

handler.before = async (m, { conn }) => {
    // Kita membuat "Jam Weker" mandiri di latar belakang.
    // Ditempelkan ke 'global' agar tidak tumpang tindih (double) jika panel di-restart
    if (!global.mesinReminder) {
        
        // Mulai detak jam setiap 1000 milidetik (1 detik)
        global.mesinReminder = setInterval(() => {
            
            // Ambil database terbaru setiap detiknya
            if (!global.db || !global.db.data || !global.db.data.users) return;
            let users = global.db.data.users;
            let now = Date.now();

            for (let jid in users) {
                let user = users[jid];
                // Lewati jika tidak punya database pengingat
                if (!user || !user.pengingat || user.pengingat.length === 0) continue;

                let sisaPengingat = [];
                let adaPerubahan = false; // Deteksi apakah perlu update database

                for (let p of user.pengingat) {
                    
                    // A. WAKTUNYA TIBA (Hitungan Detik Tepat)
                    if (p.status === 0 && now >= p.waktu) {
                        let teks = `🔔 *REMINDER OWNER* 🔔\n\n📝 *Pesan:* ${p.pesan}`;
                        
                        // Gunakan koneksi bot yang sedang aktif untuk mengirim pesan
                        let bot = global.conn || conn;
                        if (bot && bot.reply) {
                            bot.reply(jid, teks, null).catch(console.error);
                        }
                        
                        p.status = 1; // Tandai sudah dikirim
                        p.waktuHapus = now + 60000; // Hitung mundur 1 menit untuk dimusnahkan
                        
                        sisaPengingat.push(p);
                        adaPerubahan = true;
                    } 
                    
                    // B. WAKTUNYA DIHAPUS (Sudah lewat 1 menit dari pengiriman)
                    else if (p.status === 1 && now >= p.waktuHapus) {
                        adaPerubahan = true;
                        continue; // Jangan dimasukkan ke keranjang (musnah)
                    } 
                    
                    // C. BELUM WAKTUNYA (Simpan kembali)
                    else {
                        sisaPengingat.push(p);
                    }
                }
                
                // Jika ada pesan yang dikirim/dihapus, timpa database lama
                if (adaPerubahan) {
                    user.pengingat = sisaPengingat;
                }
            }
        }, 1000); // 1000 ms = 1 detik (Sangat presisi)
    }
    
    return true; // Lanjutkan agar tidak memblokir plugin lain
}

module.exports = handler;