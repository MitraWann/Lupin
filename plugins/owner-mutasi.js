/**
 * Plugin: Pencatatan Keuangan (Pemasukan, Pengeluaran, Mutasi)
 * Deskripsi: Mencatat arus kas pengguna dan menampilkannya dalam UI Tabel WhatsApp.
 */

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
    // Inisialisasi database user jika belum ada
    let user = global.db.data.users[m.sender];
    if (typeof user !== 'object') global.db.data.users[m.sender] = {};
    
    // Menggunakan variabel khusus 'saldo_kas' agar tidak bentrok dengan 'saldo' bawaan RPG
    if (typeof user.saldo_kas !== 'number') user.saldo_kas = 0; 
    if (!user.riwayatKeuangan) user.riwayatKeuangan = []; // Array untuk menyimpan histori

    let act = command.toLowerCase();

    // ==========================================
    // 1. COMMAND: .pemasukan <nominal> <keterangan>
    // ==========================================
    if (act === 'inc' || act === 'masuk') {
        if (args.length < 2) return m.reply(`*Format salah!*\n\nContoh:\n${usedPrefix}${command} 50000 Jual Akun`);
        
        let nominal = parseInt(args[0]);
        if (isNaN(nominal) || nominal <= 0) return m.reply('Nominal harus berupa angka dan lebih dari 0!');
        
        let keterangan = args.slice(1).join(' ');
        if (keterangan) keterangan = keterangan.charAt(0).toUpperCase() + keterangan.slice(1);
        
        // Pengambilan Waktu Detail
        let d = new Date();
        let tanggal = d.toLocaleString('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'short', timeStyle: 'short' });
        let hari = d.toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', weekday: 'long' });
        let tanggalLengkap = d.toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric' });
        let waktu = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' }) + ' WITA';
        
        let trxId = Math.random().toString(36).substring(2, 6).toUpperCase();

        // Update database (Gunakan saldo_kas)
        user.saldo_kas += nominal;
        user.riwayatKeuangan.push({
            id: d.getTime(),
            trxId: trxId,
            tipe: 'MASUK',
            nominal: nominal,
            ket: keterangan,
            tanggal: tanggal,
            hari: hari,
            tanggalLengkap: tanggalLengkap,
            waktu: waktu
        });

        return m.reply(`✅ *Pemasukan Berhasil Dicatat!*\n\nID: ${trxId}\nNominal: Rp ${nominal.toLocaleString('id-ID')}\nKeterangan: ${keterangan}\nSaldo saat ini: Rp ${user.saldo_kas.toLocaleString('id-ID')}`);
    }

    // ==========================================
    // 2. COMMAND: .pengeluaran <nominal> <keterangan>
    // ==========================================
    else if (act === 'exp' || act === 'keluar') {
        if (args.length < 2) return m.reply(`*Format salah!*\n\nContoh:\n${usedPrefix}${command} 20000 Beli Kuota`);
        
        let nominal = parseInt(args[0]);
        if (isNaN(nominal) || nominal <= 0) return m.reply('Nominal harus berupa angka dan lebih dari 0!');
        
        let keterangan = args.slice(1).join(' ');
        if (keterangan) keterangan = keterangan.charAt(0).toUpperCase() + keterangan.slice(1);
        
        // Pengambilan Waktu Detail
        let d = new Date();
        let tanggal = d.toLocaleString('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'short', timeStyle: 'short' });
        let hari = d.toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', weekday: 'long' });
        let tanggalLengkap = d.toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric' });
        let waktu = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' }) + ' WITA';
        
        let trxId = Math.random().toString(36).substring(2, 6).toUpperCase();

        // Update database (Gunakan saldo_kas)
        user.saldo_kas -= nominal;
        user.riwayatKeuangan.push({
            id: d.getTime(),
            trxId: trxId,
            tipe: 'KELUAR',
            nominal: nominal,
            ket: keterangan,
            tanggal: tanggal,
            hari: hari,
            tanggalLengkap: tanggalLengkap,
            waktu: waktu
        });

        return m.reply(`✅ *Pengeluaran Berhasil Dicatat!*\n\nID: ${trxId}\nNominal: Rp ${nominal.toLocaleString('id-ID')}\nKeterangan: ${keterangan}\nSaldo saat ini: Rp ${user.saldo_kas.toLocaleString('id-ID')}`);
    }

    // ==========================================
    // 3. COMMAND: .mutasi (Menampilkan Text + 2 Tabel Tergabung)
    // ==========================================
    else if (act === 'mutasi' || act === 'cashflow') {
        if (user.riwayatKeuangan.length === 0) return m.reply('⚠️ Anda belum memiliki riwayat transaksi keuangan.');

        // Menggunakan library AIRich untuk Tabel
        const { AIRich } = require('../lib/MessageBuilder.js');

        // Struktur array tabel detail (baris pertama adalah header)
        let detailTableData = [
            ["ID", "In", "Out", "Keterangan", "Saldo"]
        ];

        let runningBalance = 0; 
        let totalPemasukan = 0;
        let totalPengeluaran = 0;

        // Looping SEMUA data riwayat untuk mengisi tabel mutasi sekaligus menghitung summary
        for (let item of user.riwayatKeuangan) {
            let inStr = "-";
            let outStr = "-";

            if (item.tipe === 'MASUK') {
                runningBalance += item.nominal;
                totalPemasukan += item.nominal;
                inStr = item.nominal.toLocaleString('id-ID'); // Hapus 'Rp' agar tidak makan tempat
            } else if (item.tipe === 'KELUAR') {
                runningBalance -= item.nominal;
                totalPengeluaran += item.nominal;
                outStr = item.nominal.toLocaleString('id-ID'); // Hapus 'Rp' agar tidak makan tempat
            }

            let formattedSaldo = runningBalance.toLocaleString('id-ID');
            
            // Menampilkan teks keterangan secara utuh
            let shortKet = item.ket; 
            let idText = item.trxId || item.id.toString().slice(-4);
            
            detailTableData.push([idText, inStr, outStr, shortKet, formattedSaldo]);
        }

        // Struktur array tabel ringkasan (baris pertama adalah header)
        let summaryTableData = [
            ["Keterangan", "Total Nominal"],
            ["Pemasukan", `Rp ${totalPemasukan.toLocaleString('id-ID')}`],
            ["Pengeluaran", `Rp ${totalPengeluaran.toLocaleString('id-ID')}`],
            ["Sisa Saldo", `Rp ${user.saldo_kas.toLocaleString('id-ID')}`]
        ];

        // Teks Pendamping / Pengantar Pesan
        let preText = `╔═════════════════╗\n`;
        preText += `        *CATATAN KEUANGAN* \n`;
        preText += `╚═════════════════╝\n\n`;
        preText += `📊 *RINGKASAN ARUS KAS:*`;

        let midText = `\n🧾 *DETAIL ARUS KAS:*`;

        try {
            // Mengeksekusi pembuatan pesan dengan class AIRich
            await new AIRich()
                .addText(preText)
                .addTable(summaryTableData)
                .addText(midText)
                .addTable(detailTableData)
                .run(m.chat, conn, m);
        } catch (e) {
            console.error("Gagal mengirim mutasi AIRich:", e);
            m.reply("Terjadi kesalahan saat memuat tampilan mutasi.");
        }
    }

    // ==========================================
    // 4. COMMAND: .detailmutasi <ID>
    // ==========================================
    else if (act === 'detailtrx' || act === 'detailtransaksi') {
        if (!args[0]) return m.reply(`*Format salah!*\n\nContoh:\n${usedPrefix}${command} A1B2\n\n_(Catatan: Dapatkan ID dari tabel ${usedPrefix}mutasi)_`);
        
        let targetId = args[0].toUpperCase();
        let trx = user.riwayatKeuangan.find(x => (x.trxId || x.id.toString().slice(-4)) === targetId);
        
        if (!trx) return m.reply(`⚠️ Transaksi dengan ID *${targetId}* tidak ditemukan.`);
        
        let tipeIkon = trx.tipe === 'MASUK' ? 'Pemasukan' : 'Pengeluaran';
        
        // Kompatibilitas untuk data lama yang belum punya objek hari/tanggal detail
        let hariStr = trx.hari || "-";
        let tglStr = trx.tanggalLengkap || trx.tanggal || "-";
        let wktStr = trx.waktu || "-";

        let caption = `*📄 DETAIL TRANSAKSI*\n`;
        caption += `──────────────────\n`;
        caption += `*🔖 ID Transaksi :* ${targetId}\n`;
        caption += `*📊 Tipe Mutasi :* ${tipeIkon}\n`;
        caption += `*💰 Nominal :* Rp ${trx.nominal.toLocaleString('id-ID')}\n`;
        caption += `*📝 Keterangan :* ${trx.ket}\n\n`;
        caption += `*📅 WAKTU PENCATATAN*\n`;
        caption += `> *Hari:* ${hariStr}\n`;
        caption += `> *Tanggal:* ${tglStr}\n`;
        caption += `> *Waktu:* ${wktStr}\n`;
        caption += `──────────────────\n`;
        caption += `- Gunakan *${usedPrefix}editmutasi ${targetId}* jika ingin merubah data ini.\n`;
        caption += `- Gunakan *${usedPrefix}hapusmutasi ${targetId}* jika ingin menghapus data ini.`;

        return m.reply(caption);
    }

    // ==========================================
    // 5. COMMAND: .hapusmutasi <ID>
    // ==========================================
    else if (act === 'hapustransaksi' || act === 'hapustrx') {
        if (!args[0]) return m.reply(`*Format salah!*\n\nContoh:\n${usedPrefix}${command} A1B2\n\n_(Catatan: Dapatkan ID dari perintah ${usedPrefix}mutasi)_`);
        
        let targetId = args[0].toUpperCase();
        let index = user.riwayatKeuangan.findIndex(x => (x.trxId || x.id.toString().slice(-4)) === targetId);
        
        if (index === -1) return m.reply(`⚠️ Transaksi dengan ID *${targetId}* tidak ditemukan.`);
        
        let trx = user.riwayatKeuangan[index];
        
        // Reverse/Batalkan efek saldo
        if (trx.tipe === 'MASUK') user.saldo_kas -= trx.nominal;
        else if (trx.tipe === 'KELUAR') user.saldo_kas += trx.nominal;
        
        // Hapus array dari riwayat
        user.riwayatKeuangan.splice(index, 1);
        
        return m.reply(`✅ *Transaksi ${targetId} berhasil dihapus!*\n\nEfek pada saldo telah dibatalkan.\n💰 Saldo saat ini: Rp ${user.saldo_kas.toLocaleString('id-ID')}`);
    }

    // ==========================================
    // 6. COMMAND: .editmutasi <ID> <NominalBaru> <KeteranganBaru>
    // ==========================================
    else if (act === 'edittransaksi' || act === 'edittrx') {
        if (args.length < 3) return m.reply(`*Format salah!*\n\nContoh:\n${usedPrefix}${command} A1B2 60000 Gaji Bulanan Baru\n\n_(Catatan: Dapatkan ID dari perintah ${usedPrefix}mutasi)_`);
        
        let targetId = args[0].toUpperCase();
        let nominalBaru = parseInt(args[1]);
        if (isNaN(nominalBaru) || nominalBaru <= 0) return m.reply('Nominal baru harus berupa angka dan lebih dari 0!');
        
        let ketBaru = args.slice(2).join(' ');
        if (ketBaru) ketBaru = ketBaru.charAt(0).toUpperCase() + ketBaru.slice(1);
        let index = user.riwayatKeuangan.findIndex(x => (x.trxId || x.id.toString().slice(-4)) === targetId);
        
        if (index === -1) return m.reply(`⚠️ Transaksi dengan ID *${targetId}* tidak ditemukan.`);
        
        let trx = user.riwayatKeuangan[index];
        
        // Reverse/Batalkan efek saldo lama terlebih dahulu
        if (trx.tipe === 'MASUK') user.saldo_kas -= trx.nominal;
        else if (trx.tipe === 'KELUAR') user.saldo_kas += trx.nominal;
        
        // Update data transaksi ke nilai yang baru
        trx.nominal = nominalBaru;
        trx.ket = ketBaru;
        
        // Terapkan efek perhitungan saldo yang baru
        if (trx.tipe === 'MASUK') user.saldo_kas += trx.nominal;
        else if (trx.tipe === 'KELUAR') user.saldo_kas -= trx.nominal;
        
        return m.reply(`✅ *Transaksi ${targetId} berhasil diedit!*\n\nNominal Baru: Rp ${nominalBaru.toLocaleString('id-ID')}\nKeterangan Baru: ${ketBaru}\n💰 Saldo saat ini: Rp ${user.saldo_kas.toLocaleString('id-ID')}`);
    }

    // ==========================================
    // 7. COMMAND: .resetmutasi (Menghapus seluruh data keuangan)
    // ==========================================
    else if (act === 'resetmutasi' || act === 'resetriwayat') {
        user.saldo_kas = 0;
        user.riwayatKeuangan = [];

        return m.reply(`✅ *Seluruh Data Keuangan Berhasil Direset!*\n\nSaldo kas dan semua riwayat transaksi Anda telah dikembalikan menjadi 0.`);
    }
};

handler.help = ['masuk <nom> <ket>', 'keluar <nom> <ket>', 'mutasi', 'detailtrx <id>', 'edittrx <id> <nom> <ket>', 'hapustrx <id>', 'resetmutasi'];
handler.tags = ['keuangan'];
handler.command = /^(masuk|inc|keluar|exp|mutasi|cashflow|detailtrx|detailtransaksi|edittrx|edittransaksi|hapustransaksi|hapustrx|resetmutasi|resetriwayat)$/i;
handler.owner = true;

module.exports = handler;