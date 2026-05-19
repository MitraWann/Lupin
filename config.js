require('dotenv').config();

// ════════════════════════════════════════════════════════════
//  RTXZYBOT — config.js
//  Semua konfigurasi global bot ada di sini.
//  Untuk nilai sensitif (API key, dsb.) simpan di file .env
// ════════════════════════════════════════════════════════════

// ── Owner & Akses ─────────────────────────────────────────────
global.owner        = ['6285324023198'];   // wajib diisi — nomor owner (tanpa +)
global.mods         = ['6285324023198'];   // wajib diisi — nomor moderator
global.nameowner    = 'Mitra';
global.numberowner  = '6285324023198';

// ── Kontak & Sosial ───────────────────────────────────────────
global.mail         = 'tulipnexsupport@gmail.com';
global.gc           = 'https://chat.whatsapp.com/Futdln0tFp2Jf0uSkp9o1O?mode=gi_t';
global.instagram    = 'https://instagram.com/mitrawann';

// ── Identitas Bot ─────────────────────────────────────────────
global.botname      = 'Flora';
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


// ── Absen ─────────────────────────────────────────────────────
//global.officeLocation = { lat: -5.061025, lon: 122.436873 };
global.officeLocation = { lat: -4.006015937114635, lon: 122.51742785900527 };
global.radiusLimit    = 100; // meter
// ── Jadibot ──────────────────────────────────────────────────
global.JADIBOT_MAX       = 3;        // maksimal instance aktif
global.JADIBOT_WHITELIST = [
    "AI-novaAi.js",
    "Go-Youn-jung.js",
    "_enable.js",
    "_onlyadmin-guard.js",
    "absen.js",
    "ai-chat.js",
    "ai-claude.js",
    "ai-deep.js",
    "ai-kimi.js",
    "ai-lumo.js",
    "ai-mitra.js",
    "ai-nanobanana-edit.js",
    "ai-perplexity.js",
    "ai-vebriy.js",
    "ai-zai.js",
    "breakdown-cdn.js",
    "cdn.js",
    "dump.js",
    "getcdn.js",
    "gpt.js",
    "info-ping.js",
    "jadibot.js",
    "jadibotWhitelist.js",
    "listbanned.js",
    "menu.js",
    "mitra-delete.js",
    "mitra-get.js",
    "mitra-up.js",
    "mode.js",
    "owner-addowner.js",
    "owner-addplugin.js",
    "owner-addscrape.js",
    "owner-autobackupdb.js",
    "owner-autoreport.js",
    "owner-backupsc.js",
    "owner-banchat.js",
    "owner-banuser.js",
    "owner-block.js",
    "owner-ceklistener.js",
    "owner-clearbin.js",
    "owner-clearchat.js",
    "owner-clearsessions.js",
    "owner-cleartmp.js",
    "owner-console.js",
    "owner-dashboard_bot.js",
    "owner-dashboard_server.js",
    "owner-database.js",
    "owner-deletefile.js",
    "owner-delowner.js",
    "owner-delplugin.js",
    "owner-disablecmd.js",
    "owner-edit.js",
    "owner-exec.js",
    "owner-exec2.js",
    "owner-findcode.js",
    "owner-findcommand.js",
    "owner-findplugin.js",
    "owner-getfile.js",
    "owner-github.js",
    "owner-mutasi.js",
    "owner-resetdb.js",
    "owner-resetprefix.js",
    "owner-resetuser.js",
    "owner-savefile.js",
    "owner-setppbot.js",
    "owner-setprefixbot.js",
    "owner-simulate.js",
    "owner-tracer.js",
    "owner-tree.js",
    "owner-trojan.js",
    "owner-unbanchat.js",
    "owner-unbanuser.js",
    "owner-updver.js",
    "run.js",
    "runtime.js",
    "scihub.js",
    "scipio.js",
    "self.js",
    "stiker.js",
    "timer.js",
    "tools-base64.js",
    "tools-binary.js",
    "tools-cekidch.js",
    "tools-cekrek.js",
    "tools-cekresolusi.js",
    "tools-delete.js",
    "tools-device.js",
    "tools-editmsg.js",
    "tools-enc.js",
    "tools-faceswap.js",
    "tools-fakesize.js",
    "tools-ipwho.js",
    "tools-join.js",
    "tools-kalkulator.js",
    "tools-lookup.js",
    "tools-lrc.js",
    "tools-mycontact.js",
    "tools-nddbg.js",
    "tools-npm.js",
    "tools-ocr.js",
    "tools-ogg.js",
    "tools-repeat.js",
    "tools-resize.js",
    "tools-rvo.js",
    "tools-say.js",
    "webanalyze.js",
    "xp-limit.js",
    "xp-regist.js",
    "xp-token.js",
    "zlib.js"
];

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
