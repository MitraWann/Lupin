/**
 * cluster.js
 *
 * Fixed:
 *  #1 - require('../main') untuk connectionOptions — main.js tidak pernah export ini → undefined crash
 *  #2 - require('./simple') race condition — makeWASocket belum ter-export saat IIFE async belum selesai
 *  #3 - !os.cpus().length <= 1 operator precedence salah → kondisi selalu true
 *  #4 - cluster.setupMaster deprecated Node 16+ → gunakan setupPrimary dengan fallback
 *  #5 - `event, updates` comma operator — tidak melakukan apapun, bukan event forwarder
 *  #6 - Auto-execute saat di-require modul lain — perbaiki guard require.main
 */

const cluster = require('cluster')
const os      = require('os')
const path    = require('path')

// [FIX #1] Hapus require('../main') — connectionOptions tidak pernah di-export dari main.js.
// connectionOptions dibangun sendiri di dalam baileys() secara mandiri.

// [FIX #2] simple.js menggunakan async IIFE — exports.makeWASocket belum tentu
// ter-assign saat require('./simple') dijalankan secara sinkron (race condition).
// Gunakan lazy require + polling dengan timeout agar makeWASocket pasti tersedia.
async function getSimple() {
    const simple = require('./simple')
    const timeout = Date.now() + 10_000 // maks tunggu 10 detik
    while (typeof simple.makeWASocket !== 'function') {
        if (Date.now() > timeout) throw new Error('[cluster] Timeout menunggu simple.makeWASocket — pastikan Baileys terinstall')
        await new Promise(r => setTimeout(r, 100))
    }
    return simple
}

var conn

module.exports = {
    async Cluster() {
        // [FIX #3] Operator precedence salah pada kondisi original:
        //   !os.cpus().length <= 1
        //   = (!os.cpus().length) <= 1
        //   = (false) <= 1
        //   = true  ← selalu throw, bahkan di mesin normal
        //
        // Fix: periksa panjang array CPU secara langsung
        if (os.cpus().length < 1) {
            throw new Error(`Requires at least 1 core, but detected ${os.cpus().length} cores`)
        }

        // [FIX #4] cluster.setupMaster deprecated sejak Node.js 16, diganti setupPrimary.
        // Gunakan setupPrimary jika tersedia, fallback ke setupMaster untuk Node < 16.
        if (cluster.isPrimary ?? cluster.isMaster) {
            const setupFn = cluster.setupPrimary ?? cluster.setupMaster
            setupFn({
                exec: path.join(__dirname, './cluster.js')
            })

            cluster.fork()
            console.log('[cluster] Workers:', cluster.workers)
        }
        // Worker branch — baileys() dipanggil secara eksplisit di blok isWorker bawah
    },

    async baileys() {
        // [FIX #1] Bangun connectionOptions secara mandiri menggunakan baileys-loader
        // dan session folder dari global.opts, tanpa bergantung pada main.js
        const { loadBaileys } = await import('../baileys-loader.mjs')
        const baileys = await loadBaileys()
        const {
            useMultiFileAuthState,
            makeCacheableSignalKeyStore,
            fetchLatestBaileysVersion
        } = baileys

        require('../config') // pastikan global.opts & config tersedia
        const NodeCache = require('node-cache')
        const pino      = require('pino')

        const opts          = global.opts || {}
        const sessionFolder = String(opts._?.[0] || 'sessions')

        const { state, saveCreds }  = await useMultiFileAuthState(sessionFolder)
        const { version, isLatest } = await fetchLatestBaileysVersion()
        console.log(`[cluster] Baileys v${version.join('.')}, isLatest: ${isLatest}`)

        const connectionOptions = {
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys:  makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'silent' })
                )
            },
            msgRetryCounterCache:          new NodeCache(),
            browser:                       ['Chrome (Linux)', '', ''],
            connectTimeoutMs:              60_000,
            defaultQueryTimeoutMs:         undefined,
            keepAliveIntervalMs:           15_000,
            generateHighQualityLinkPreview: true,
            syncFullHistory:               false,
            markOnlineOnConnect:           false
        }

        // [FIX #2] Gunakan getSimple() agar makeWASocket pasti sudah ter-export
        const simple = await getSimple()
        conn = simple.makeWASocket(connectionOptions)

        // [FIX #5] `event, updates` adalah comma operator — tidak melakukan apapun.
        // Diperbaiki menjadi event forwarder ke primary process via process.send
        // agar primary bisa menerima event dari worker jika diperlukan.
        // Jika forwarding tidak dibutuhkan, hapus loop ini sepenuhnya.
        for (const event of Object.keys(conn.ev._events || {})) {
            conn.ev.on(event, (...updates) => {
                if (process.send) process.send({ event, updates })
            })
        }

        // Simpan kredensial setiap ada update sesi
        conn.ev.on('creds.update', saveCreds)

        return conn
    },

    convert() {
        // Placeholder — implementasi konversi media jika diperlukan
    }
}

// [FIX #6] Guard diperbaiki: gunakan require.main === module agar blok ini
// TIDAK auto-execute saat cluster.js di-require dari modul lain.
// Versi asli langsung execute saat di-require → side effect tidak terduga.
// Catatan: file ini tidak dipanggil dari main.js maupun index.js (dead code).
// Aktifkan hanya jika arsitektur multi-worker benar-benar dibutuhkan.
if (require.main === module) {
    if (cluster.isWorker) {
        module.exports.baileys().catch(err => {
            console.error('[cluster] Worker gagal menginisialisasi baileys:', err)
            process.exit(1)
        })
    } else {
        module.exports.Cluster().catch(err => {
            console.error('[cluster] Primary gagal menginisialisasi cluster:', err)
            process.exit(1)
        })
    }
}
