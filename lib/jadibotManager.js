'use strict';

const path = require('path');
const fs   = require('fs');

// ── Jadibot Instance Manager ──────────────────────────────────
const instances = new Map(); // nomor → { conn, ownerJid, status, handlerAttached }

const SESSIONS_DIR = path.join(__dirname, '../sessions/jadibot');

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

ensureDir(SESSIONS_DIR);

async function createInstance(phoneNumber, ownerJid, mainConn, chatJid) {
    const { loadBaileys } = await import('../baileys-loader.mjs');
    const {
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore,
        Browsers,
        DisconnectReason,
    } = await loadBaileys();
    const { makeWASocket } = require('./simple');

    const useSQLiteAuthState = require('./sqliteAuthState');
    const NodeCache = require('node-cache');
    const pino      = require('pino');

    const sessionPath = path.join(SESSIONS_DIR, phoneNumber, 'sessions.db');
    ensureDir(path.dirname(sessionPath));

    const { state, saveCreds } = await useSQLiteAuthState(sessionPath);
    const { version }          = await fetchLatestBaileysVersion();

    const msgRetryCounterCache = new NodeCache();

    const sock = makeWASocket({
        printQRInTerminal:        false,
        syncFullHistory:          false,
        shouldSyncHistoryMessage: () => false,
        markOnlineOnConnect:      true,
        connectTimeoutMs:         60000,
        keepAliveIntervalMs:      30000,
        retryRequestDelayMs:      250,
        maxMsgRetryCount:         5,
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        msgRetryCounterCache,
        browser: Browsers.ubuntu('Edge'),
        logger:  pino({ level: 'error' }),
        version,
    });

    instances.set(phoneNumber, {
        conn:            sock,
        ownerJid,
        status:          'connecting',
        sessionPath,
        handlerAttached: false,
    });

    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                await mainConn.sendMessage(chatJid, {
                    text: [
                        '╭─「 *JADIBOT* 」',
                        '│ Nomor: *+' + phoneNumber + '*',
                        '│ Kode Pairing:',
                        '│ *' + code + '*',
                        '│',
                        '│ Buka WhatsApp → Setelan →',
                        '│ Perangkat Tertaut → Tautkan',
                        '│ Perangkat → Tautkan dengan',
                        '│ Nomor Telepon → masukkan kode.',
                        '╰──────────────────'
                    ].join('\n'),
                });
            } catch (e) {
                console.error('[JadibotManager] Gagal request pairing code:', e.message);
                if (chatJid) await mainConn.sendMessage(chatJid, {
                    text: '❌ Gagal generate pairing code untuk +' + phoneNumber + '. Coba lagi.',
                });
                instances.delete(phoneNumber);
            }
        }, 3000);
    }

    const inst0 = instances.get(phoneNumber);
    if (!inst0.handlerAttached) {
        const { smsg } = require('./simple');
        if (typeof smsg === 'function') {
            sock.serializeM = async (m) => await smsg(sock, m);
        }
        const { attachHandler } = require('./jadibotHandler');
        attachHandler(sock, phoneNumber, ownerJid, mainConn);
        inst0.handlerAttached = true;
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        const inst = instances.get(phoneNumber);
        if (!inst) return;

        if (connection === 'open') {
            inst.status = 'connected';
            console.log('[JadibotManager] Connected:', phoneNumber);
            if (chatJid) await mainConn.sendMessage(chatJid, {
                text: '✅ Bot *+' + phoneNumber + '* berhasil terhubung!',
            });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (
                reason === DisconnectReason.loggedOut ||
                reason === DisconnectReason.badSession ||
                reason === DisconnectReason.connectionReplaced ||
                reason === 401
            ) {
                console.log('[JadibotManager] Session invalid, hapus instance:', phoneNumber);
                try {
                    fs.rmSync(path.join(SESSIONS_DIR, phoneNumber), { recursive: true, force: true });
                    console.log('[JadibotManager] Session folder dihapus:', phoneNumber);
                } catch (e) {
                    console.error('[JadibotManager] Gagal hapus session folder:', e.message);
                }
                instances.delete(phoneNumber);
                const notifTarget = chatJid || (ownerJid !== 'recovered' ? ownerJid : null);
                if (notifTarget) await mainConn.sendMessage(notifTarget, {
                    text: '⚠️ Bot *+' + phoneNumber + '* terputus karena session invalid dan telah dihapus otomatis. Silakan daftar ulang dengan command jadibot.',
                });
            } else {
                inst.status = 'reconnecting';
                console.log('[JadibotManager] Reconnecting:', phoneNumber);
                instances.delete(phoneNumber);
                setTimeout(() => createInstance(phoneNumber, ownerJid, mainConn, chatJid), 5000);
            }
        }
    });

    return sock;
}

async function stopInstance(phoneNumber, requesterJid) {
    const inst = instances.get(phoneNumber);
    if (!inst) return { ok: false, msg: 'Instance tidak ditemukan.' };
    if (inst.ownerJid !== requesterJid && !global.owner?.includes(requesterJid?.split('@')[0])) {
        return { ok: false, msg: 'Kamu bukan pemilik bot ini.' };
    }
    try {
        inst.conn.ev.removeAllListeners();
        inst.conn.ws.close();
    } catch (_) {}
    instances.delete(phoneNumber);
    return { ok: true, msg: 'Bot *+' + phoneNumber + '* berhasil dihentikan.' };
}

function listInstances() {
    return [...instances.entries()].map(([num, inst]) => ({
        number: num,
        owner:  inst.ownerJid,
        status: inst.status,
    }));
}

function hasInstance(phoneNumber) {
    return instances.has(phoneNumber);
}

function instanceCount() {
    return instances.size;
}

async function recoverSessions(mainConn) {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const numbers = fs.readdirSync(SESSIONS_DIR).filter(f =>
        fs.existsSync(path.join(SESSIONS_DIR, f, 'sessions.db'))
    );
    for (const num of numbers) {
        try {
            console.log('[JadibotManager] Recovering session:', num);
            await createInstance(num, 'recovered', mainConn, null);
        } catch (e) {
            console.error('[JadibotManager] Gagal recover:', num, e.message);
        }
    }
}

module.exports = {
    instances,
    createInstance,
    stopInstance,
    listInstances,
    hasInstance,
    instanceCount,
    recoverSessions,
    SESSIONS_DIR,
};
