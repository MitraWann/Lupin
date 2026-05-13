// ============================================================
//  Lupin - WhatsApp Bot (main.js)
//  Deobfuscated, Cleaned Up & Fixed
// ============================================================

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

(async () => {
    // ── Dependencies ─────────────────────────────────────────
    require('./config');

    const { loadBaileys } = require('./baileys-loader.mjs');
    const {
        useMultiFileAuthState,
        DisconnectReason,
        generateForwardMessageContent,
        prepareWAMessageMedia,
        generateWAMessageFromContent,
        generateMessageID,
        downloadContentFromMessage,
        makeCacheableSignalKeyStore,
        makeInMemoryStore,
        jidDecode,
        fetchLatestBaileysVersion,
        proto,
        Browsers
    } = await loadBaileys();

    const NodeCache        = require('node-cache');
    const pino             = require('pino');
    const ws               = require('ws');
    const path             = require('path');
    const fs               = require('fs');
    const os               = require('os');
    const yargs            = require('yargs/yargs');
    const { spawn }        = require('child_process');
    const lodash           = require('lodash');
    const syntaxError      = require('syntax-error');
    const chalk            = require('chalk');
    const readline         = require('readline');
    const fetch            = require('node-fetch');

    // ── Trigger simple.js IIFE agar exports terisi ────────────
    require('./lib/simple');
    let makeWASocket;

    // ── lowdb (try system, fall back to local lib) ────────────
    const { Low, JSONFile } = require('lowdb');

    // ── MongoDB adapter ───────────────────────────────────────
    const mongoDB = require('./lib/mongoDB');

    // ── CLI options ───────────────────────────────────────────
    // [FIX] Parse sekali, jadikan global, reuse — tidak duplikasi
    global.opts = Object(yargs(process.argv.slice(2)).parse());
    const opts = global.opts;

    // ── Readline interface (for pairing code input) ───────────
    const rl = readline.createInterface({
        input:  process.stdin,
        output: process.stdout
    });
    const question = (text) => new Promise(resolve => rl.question(text, resolve));

    // ── Global API helper ─────────────────────────────────────
    // [FIX] Pastikan global.APIs dan global.APIKeys ada sebelum diakses
    if (!global.APIs)    global.APIs    = {};
    if (!global.APIKeys) global.APIKeys = {};

    global.API = (name, path = '/', params = {}, apiKey) =>
        (name in global.APIs ? global.APIs[name] : name) + path +
        (params || apiKey
            ? '?' + new URLSearchParams(Object.fromEntries({
                ...params,
                ...(apiKey ? { [apiKey]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {})
              }))
            : '');

    // ── Global state ──────────────────────────────────────────
    global.timestamp = { start: new Date() };

    global.prefix = new RegExp('^[' + (opts.prefix || '‎xzXZ/i!#$%+£¢€¥^°¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');

    // ── Database setup ────────────────────────────────────────
    // [FIX] cloudDBAdapter tidak pernah di-import — tambahkan require kondisional
    let dbAdapter;
    if (/https?:\/\//.test(opts.db || '')) {
        let cloudDBAdapter;
        try {
            cloudDBAdapter = require('./lib/cloudDBAdapter');
        } catch (e) {
            console.error(chalk.red('[ERROR] lib/cloudDBAdapter tidak ditemukan! Fallback ke JSONFile.'));
            cloudDBAdapter = null;
        }
        dbAdapter = cloudDBAdapter ? new cloudDBAdapter(opts.db) : new JSONFile('database.json');
    } else if (/mongodb/.test(opts.db || '')) {
        dbAdapter = new mongoDB(opts.db);
    } else {
        dbAdapter = new JSONFile((opts._[0] ? opts._[0] + '_' : '') + 'database.json');
    }

    global.db = new Low(dbAdapter);
    global.DATABASE = global.db;

    global.loadDatabase = async function loadDatabase() {
        if (global.db.READ) {
            // [FIX] clearInterval(this) tidak bekerja di dalam setInterval callback
            // Gunakan referensi interval yang benar
            return new Promise(resolve => {
                const interval = setInterval(function () {
                    if (!global.db.READ) {
                        clearInterval(interval);
                        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
                    }
                }, 1000);
            });
        }
        if (global.db.data !== null) return;

        global.db.READ = true;
        await global.db.read();
        global.db.READ = false;

        global.db.data = {
            users:   {},
            chats:   {},
            stats:   {},
            msgs:    {},
            sticker: {},
            ...global.db.data || {}
        };
        global.db.chain = lodash.chain(global.db.data);
    };
    loadDatabase();

    // ── Session folder ────────────────────────────────────────
    const sessionFolder = '' + (opts._[0] || 'sessions');
    // [FIX] Cek & buat folder sekaligus, tidak double existsSync
    global.isInit = !fs.existsSync(sessionFolder);
    if (global.isInit) {
        fs.mkdirSync(sessionFolder, { recursive: true });
    }

    // ── Cek Izin Tulis ke Folder Session ─────────────────────
    try {
        const testFile = path.join(sessionFolder, 'test_write.txt');
        fs.writeFileSync(testFile, 'test OK');
        fs.unlinkSync(testFile);
        console.log(chalk.green(`[DEBUG] Izin tulis ke folder '${sessionFolder}' BERHASIL.`));
    } catch (e) {
        console.error(chalk.red(`[CRITICAL ERROR] Gagal menulis ke folder '${sessionFolder}'. Ini penyebab utama kredensial tidak tersimpan!`), e);
    }

    // ── Pengecekan Auth Awal ──────────────────────────────────
    const { state: initState } = await useMultiFileAuthState(sessionFolder);

    // ── WhatsApp version ──────────────────────────────────────
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.bgGreen('-- using WA v' + version.join('.') + ', isLatest: ' + isLatest + ' --'));

    // ── Request Phone Number for Pairing ──────────────────────
    let phoneNumber = '';
    if (!initState.creds.registered) {
        if (fs.existsSync(path.join(sessionFolder, 'creds.json'))) {
            console.log(chalk.bgRed('-- WARNING: creds.json is broken, please delete it first --'));
            process.exit(0);
        }

        do {
            phoneNumber = await question(chalk.yellow('ENTER A VALID NUMBER START WITH REGION CODE. Example : 62xxx:\n'));
        } while (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10);

        rl.close();
        phoneNumber = phoneNumber.replace(/\D/g, '');
        console.log(chalk.bgWhite(chalk.black('-- Please wait, generating code... --')));
    } else {
        rl.close();
    }

    // ── Auto-save DB ──────────────────────────────────────────
    if (!opts.test) {
        if (global.db) {
            setInterval(async () => {
                if (global.db.data) await global.db.write();
                if (!opts.tmp && (global.support || {}).find) {
                    [os.tmpdir(), 'tmp'].forEach(dir => spawn('find', [dir, '-amin', '3', '-type', 'f', '-delete']));
                }
            }, 30 * 1000);
        }
    }

    // ── Persiapan simple.js ───────────────────────────────────
    let _simpleLib = require('./lib/simple');
    let waitTime = 0;
    while (!_simpleLib.makeWASocket && waitTime < 15000) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waitTime += 500;
    }
    if (!_simpleLib.makeWASocket) throw new Error("Timeout mengambil makeWASocket dari simple.js");

    makeWASocket = _simpleLib.makeWASocket;

    // ── Mencegah Bot Mati Diam-Diam (Silent Crash) ─────────────
    process.on('uncaughtException', (err) => {
        console.error(chalk.bgRed.white('\n[FATAL ERROR] Terjadi Uncaught Exception (Tapi bot tetap hidup):'));
        console.error(err);
    });
    process.on('unhandledRejection', (err) => {
        console.error(chalk.bgRed.white('\n[FATAL ERROR] Terjadi Unhandled Rejection (Tapi bot tetap hidup):'));
        console.error(err);
    });
    process.on('exit', (code) => {
        if (code !== 0) console.log(chalk.bgRed.white(`\n[SYSTEM] Proses Node.js mati paksa dengan kode exit: ${code}`));
    });

    // ── Plugin hot-reload helper ──────────────────────────────
    const reRequire = (modulePath) => {
        modulePath = require.resolve(modulePath);
        let mod;
        let attempts = 0;
        do {
            if (modulePath in require.cache) delete require.cache[modulePath];
            mod = require(modulePath);
            attempts++;
        } while ((!mod || (Array.isArray(mod) || mod instanceof String) ? !(mod || []).length : typeof mod === 'object' && !Buffer.isBuffer(mod) ? !Object.keys(mod || {}).length : true) && attempts <= 10);
        return mod;
    };

    // ── FUNGSI START BOT (Pusat Koneksi Utama) ────────────────
    async function startBot() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
        const msgRetryCounterCache = new NodeCache();

        const socketConfig = {
            printQRInTerminal:              false,
            syncFullHistory:                false,
            shouldSyncHistoryMessage:       () => false,
            markOnlineOnConnect:            true,
            connectTimeoutMs:               60000,
            keepAliveIntervalMs:            30000,
            retryRequestDelayMs:            250,
            maxMsgRetryCount:               5,
            generateHighQualityLinkPreview: true,
            patchMessageBeforeSending: (msg) => {
                if (!!(msg.buttonsMessage || msg.templateMessage || msg.listMessage)) {
                    msg = { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} }, ...msg } } };
                }
                return msg;
            },
            auth: {
                creds: state.creds,
                keys:  makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'silent', stream: 'store' }))
            },
            msgRetryCounterCache,
            browser: Browsers.ubuntu('Edge'),
            logger:  pino({ level: 'error' }),
            version
        };

        // Tutup koneksi lama secara aman untuk mencegah listener dobel
        if (global.conn) {
            try { global.conn.ws.close(); } catch (_) {}
            if (global.conn.ev) global.conn.ev.removeAllListeners();
        }

        global.conn = makeWASocket(socketConfig);

        // Generate Pairing Code
        if (!global.conn.authState.creds.registered && phoneNumber) {
            setTimeout(async () => {
                try {
                    const _0x8f2a = [80, 76, 87, 85, 68, 90, 68, 81];
                    let code = await global.conn.requestPairingCode(phoneNumber, String.fromCharCode(..._0x8f2a.map(x => x - 3)));

                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log(chalk.bgBlue(chalk.black('\n Your Pairing Code : ')), chalk.bgBlue(chalk.white(code)));
                } catch (e) {
                    console.error(chalk.red('\n[ERROR] Gagal request kode pairing ke server WA.'));
                }
            }, 3000);
        }

        // Connection Update
        global.conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            global.timestamp.connect = new Date();

            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode;
                const errMessage = String(lastDisconnect?.error);

                if (!reason && errMessage.includes('515')) reason = DisconnectReason.restartRequired;

                if (reason === DisconnectReason.badSession) {
                    console.log(chalk.red('[ERROR] Session buruk, silakan hapus folder sessions dan jalankan ulang.'));
                    process.exit(0);
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log(chalk.yellow('[INFO] Koneksi tertutup, menghubungkan ulang...'));
                    startBot();
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log(chalk.yellow('[INFO] Koneksi terputus, menghubungkan ulang...'));
                    startBot();
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log(chalk.red('[ERROR] Session tergantikan (bot login di tempat lain). Silakan pairing ulang.'));
                    process.exit(0);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.red('[ERROR] Device dikeluarkan. Silakan hapus folder sessions dan pairing ulang.'));
                    process.exit(0);
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log(chalk.green('\n[SUKSES] Pairing Berhasil! Memulai ulang koneksi untuk memuat sesi...'));
                    setTimeout(() => startBot(), 2000);
                } else if (reason === DisconnectReason.timedOut) {
                    console.log(chalk.yellow('[INFO] Koneksi Timeout, menghubungkan ulang...'));
                    startBot();
                } else {
                    console.log(chalk.red(`[ERROR] Terputus karena alasan tak diketahui (Kode: ${reason}). Menghubungkan ulang...`));
                    startBot();
                }
            } else if (connection === 'open') {
                console.log(chalk.green('✓ Terhubung ke WhatsApp!'));
            }

            if (global.db.data == null) await loadDatabase();
        });

        // Save Creds setiap ada pembaruan sesi
        global.conn.ev.on('creds.update', saveCreds);

        // Load Event Handlers
        global.reloadHandler = function () {
            let handler;
            try {
                handler = reRequire('./handler');
            } catch (e) {
                console.error(chalk.red('\n[ERROR] Gagal memuat handler.js. (Akan dibypass agar bot tetap hidup):'), e.message);
                handler = {};
            }

            global.conn.welcome  = 'Selamat datang @user di group @subject utamakan baca desk ya \n@desc';
            global.conn.bye      = 'Selamat tinggal @user 👋';
            global.conn.promote  = '@user sekarang admin!';
            global.conn.demote   = '@user sekarang bukan admin!';

            // Bersihkan listener lama
            if (global.conn.handler)           global.conn.ev.off('messages.upsert',         global.conn.handler);
            if (global.conn.participantsUpdate) global.conn.ev.off('group-participants.update', global.conn.participantsUpdate);
            if (global.conn.onDelete)          global.conn.ev.off('message.delete',           global.conn.onDelete);
            if (global.conn.pollHandler)       global.conn.ev.off('messages.update',          global.conn.pollHandler);

            const fnHandler      = handler?.handler             || handler?.default?.handler;
            const fnParticipants = handler?.participantsUpdate  || handler?.default?.participantsUpdate;
            const fnDelete       = handler?.onDelete            || handler?.default?.onDelete;

            if (typeof fnHandler === 'function') {
                global.conn.handler = fnHandler.bind(global.conn);
                global.conn.ev.on('messages.upsert', global.conn.handler);
            } else {
                console.log(chalk.red('[WARNING] handler.handler tidak ditemukan! Pesan tidak akan terbaca sampai handler.js diperbaiki.'));
                // [FIX #5] Pasang watchFile agar saat handler.js diperbaiki & disimpan,
                // bot otomatis reload tanpa perlu restart penuh
                const handlerPath = require.resolve('./handler');
                fs.watchFile(handlerPath, { interval: 1000 }, () => {
                    fs.unwatchFile(handlerPath);
                    console.log(chalk.yellow('[INFO] Perubahan handler.js terdeteksi — mencoba reload...'));
                    if (global.reloadHandler) global.reloadHandler();
                });
            }

            if (typeof fnParticipants === 'function') {
                global.conn.participantsUpdate = fnParticipants.bind(global.conn);
                global.conn.ev.on('group-participants.update', global.conn.participantsUpdate);
            }

            if (typeof fnDelete === 'function') {
                global.conn.onDelete = fnDelete.bind(global.conn);
                global.conn.ev.on('message.delete', global.conn.onDelete);
            }

            const fnPollUpdate = handler?.pollUpdate || handler?.default?.pollUpdate;
            if (typeof fnPollUpdate === 'function') {
                global.conn.pollHandler = fnPollUpdate.bind(global.conn);
                global.conn.ev.on('messages.update', global.conn.pollHandler);
            }

            return true;
        };
        global.reloadHandler();
    }

    // Jalankan bot pertama kali
    startBot().catch(err => {
        console.error(chalk.bgRed.white('\n[FATAL] Gagal menjalankan startBot():'), err);
    });

    // ── Load plugins ──────────────────────────────────────────
    // [FIX] Tunggu startBot selesai agar global.conn sudah tersedia
    // sebelum plugin loader dipanggil. Gunakan conn.logger via global.conn
    // dengan guard agar tidak crash jika conn belum siap.
    const pluginsDir = path.join(__dirname, 'plugins');
    const isJsFile   = (f) => /\.js$/.test(f);
    const safeLog    = {
        info:  (...a) => global.conn?.logger?.info(...a)  ?? console.log(...a),
        warn:  (...a) => global.conn?.logger?.warn(...a)  ?? console.warn(...a),
        error: (...a) => global.conn?.logger?.error(...a) ?? console.error(...a),
    };

    global.plugins = {};
    for (let file of fs.readdirSync(pluginsDir).filter(isJsFile)) {
        try {
            global.plugins[file] = require(path.join(pluginsDir, file));
        } catch (e) {
            // [FIX] Ganti conn.logger (undefined) dengan safeLog
            safeLog.error(e);
            delete global.plugins[file];
        }
    }
    console.log('[Plugins loaded]', Object.keys(global.plugins));

    // ── Watch plugins folder for changes (hot reload) ─────────
    global.reload = (event, filename) => {
        if (!filename || !isJsFile(filename)) return;

        const fullPath = path.join(pluginsDir, filename);

        if (fullPath in require.cache) {
            delete require.cache[fullPath];
            if (fs.existsSync(fullPath)) {
                safeLog.info("re - require plugin '" + filename + "'");
            } else {
                safeLog.warn("deleted plugin '" + filename + "'");
                return delete global.plugins[filename];
            }
        } else {
            safeLog.info("requiring new plugin '" + filename + "'");
        }

        const err = syntaxError(fs.readFileSync(fullPath), filename);
        if (err) {
            safeLog.error("syntax error while loading '" + filename + "'\n" + err);
        } else {
            try {
                global.plugins[filename] = require(fullPath);
            } catch (e) {
                safeLog.error(e);
            } finally {
                global.plugins = Object.fromEntries(
                    Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
                );
            }
        }
    };
    Object.freeze(global.reload);
    fs.watch(pluginsDir, global.reload);

    // ── Check external tool availability ─────────────────────
    async function checkTools() {
        const check = (cmd, args = []) => {
            const proc = spawn(cmd, args);
            return Promise.race([
                new Promise(resolve => proc.on('close', code  => resolve(code !== 127))),
                new Promise(resolve => proc.on('error', ()    => resolve(false)))
            ]);
        };

        const results = await Promise.all([
            check('ffmpeg'),
            check('ffprobe'),
            check('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
            check('convert'),
            check('magick'),
            check('gm'),
            check('find', ['--version'])
        ]);

        const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = results;
        console.log('[checkTools]', results);

        global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find };
        Object.freeze(global.support);

        if (!ffmpeg)
            safeLog.warn('Please install ffmpeg for sending videos (pkg install ffmpeg)');
        if (ffmpeg && !ffmpegWebp)
            safeLog.warn('Stickers may not animated without libwebp on ffmpeg (--enable-libwebp while compiling ffmpeg)');
        if (!convert && !magick && !gm)
            safeLog.warn('Stickers may not work without imagemagick (pkg install imagemagick)');
    }

    // [FIX] .catch('error') bukan fungsi — ganti dengan arrow function
    checkTools()
        .then(() => safeLog.info('Quick Test Done'))
        .catch(e => console.error(chalk.red('[checkTools Error]'), e));

})();
