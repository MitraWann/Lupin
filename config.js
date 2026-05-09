require('dotenv').config();

// ════════════════════════════════════════════════════════════
//  RTXZYBOT — config.js
//  Semua konfigurasi global bot ada di sini.
//  Untuk nilai sensitif (API key, dsb.) simpan di file .env
// ════════════════════════════════════════════════════════════

// ── Owner & Akses ─────────────────────────────────────────────
global.owner        = ['6285324023198'];   // wajib diisi — nomor owner (tanpa +)
global.mods         = ['6285324023198'];   // wajib diisi — nomor moderator
global.nameowner    = 'Wann';
global.numberowner  = '6285324023198';

// ── Kontak & Sosial ───────────────────────────────────────────
global.mail         = 'tulipnexsupport@gmail.com';
global.gc           = 'https://chat.whatsapp.com/Futdln0tFp2Jf0uSkp9o1O?mode=gi_t';
global.instagram    = 'https://instagram.com/mitrawann';

// ── Identitas Bot ─────────────────────────────────────────────
global.botname      = 'Lupin MD';
global.wm           = `© ${global.botname}`;

// ── Pesan Sistem ──────────────────────────────────────────────
global.wait         = '_*Tunggu sedang di proses...*_';
global.eror         = '_*Server Error*_';
global.stiker_wait  = '*⫹⫺ Stiker sedang dibuat...*';

// ── Sticker Metadata ──────────────────────────────────────────
global.packname     = 'Created-By';
global.author       = 'Mitraaa';

// ── Batas & Limit ─────────────────────────────────────────────
global.maxwarn      = 5;

// ── API Keys ──────────────────────────────────────────────────
// [FIX] API key sensitif sebaiknya disimpan di .env
// Tambahkan baris berikut ke file .env:
//   NYT_API_KEY=a7mMCVwS0o40SUo3aqWkDxTAfL51vI7XYsCAAKBSx9uRbAUG
// Fallback ke nilai hardcoded hanya jika .env belum diisi
global.nytApiKey    = process.env.NYT_API_KEY || 'a7mMCVwS0o40SUo3aqWkDxTAfL51vI7XYsCAAKBSx9uRbAUG';

// ── API Registry ──────────────────────────────────────────────
// [FIX] global.APIs & global.APIKeys harus didefinisikan di sini
// agar global.API() di main.js tidak crash dengan "undefined in global.APIs"
// Tambahkan API pihak ketiga di sini sesuai kebutuhan:
// Contoh: global.APIs = { MyAPI: 'https://api.example.com' }
//         global.APIKeys = { 'https://api.example.com': process.env.MY_API_KEY }
global.APIs    = {};
global.APIKeys = {};

// ── Fitur Toggle ──────────────────────────────────────────────
global.autobio  = false; // true = aktifkan autobio
global.antiporn = false; // true = auto delete pesan porno (bot harus admin)
global.spam     = false; // true = anti spam aktif
global.gcspam   = false; // true = tutup grup saat spam terdeteksi

// ── Hot-reload watcher ────────────────────────────────────────
let fs    = require('fs');
let chalk = require('chalk');
let file  = require.resolve(__filename);

fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright("Update 'config.js'"));
    delete require.cache[file];
    require(file);
});
