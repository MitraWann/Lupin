/**
 * baileys-loader.mjs
 * Loader terpusat untuk @whiskeysockets/baileys (ESM → CJS bridge)
 *
 * Fixes:
 *  - WAMessageStubType duplikat — key pertama (line 12) salah assign ke fetchLatestBaileysVersion
 *  - makeWALegacySocket tidak ada di Baileys modern → guard dengan fallback null
 *  - Export deprecated/mungkin undefined (MessageType, generateWAMessage, generateWAMessageContent)
 *    diberi fallback null agar tidak crash saat destructuring di caller
 *  - Tambahkan guard: setiap field yang mungkin undefined di-fallback ke null
 *    sehingga caller bisa cek `if (fn)` sebelum pakai
 */

export const loadBaileys = async () => {
    const baileys = await import('@whiskeysockets/baileys');

    // Helper: ambil export dengan fallback null jika tidak tersedia
    const get = (key) => baileys[key] ?? null;

    // [FIX] WAMessageStubType hanya didefinisikan SEKALI dengan nilai yang BENAR
    // Versi asli: key pertama salah assign ke fetchLatestBaileysVersion (copy-paste bug)
    const WAMessageStubType = get('WAMessageStubType');

    // [FIX] makeWALegacySocket tidak ada di Baileys modern — fallback null
    // Caller (simple.js) sudah guard dengan global.opts?.['legacy']
    const makeWALegacySocket = get('makeWALegacySocket');
    if (!makeWALegacySocket) {
        console.warn('[baileys-loader] makeWALegacySocket tidak tersedia di versi Baileys ini. opts.legacy akan diabaikan.');
    }

    // [FIX] Peringatkan jika export deprecated tidak tersedia
    // agar plugin yang masih memakainya tahu persis apa yang hilang
    const deprecated = ['MessageType', 'generateWAMessageContent', 'generateWAMessage'];
    for (const key of deprecated) {
        if (!baileys[key]) {
            console.warn(`[baileys-loader] '${key}' tidak tersedia di versi Baileys ini (mungkin deprecated).`);
        }
    }

    return {
        // ── Auth & Connection ─────────────────────────────────
        useMultiFileAuthState:      get('useMultiFileAuthState'),
        DisconnectReason:           get('DisconnectReason'),
        fetchLatestBaileysVersion:  get('fetchLatestBaileysVersion'),
        makeCacheableSignalKeyStore: get('makeCacheableSignalKeyStore'),
        makeInMemoryStore:          get('makeInMemoryStore'),
        Browsers:                   get('Browsers'),

        // ── Socket constructors ───────────────────────────────
        // makeWASocket: prefer named export, fallback ke default export
        makeWASocket:               get('makeWASocket') ?? baileys.default ?? null,
        // [FIX] Legacy socket — null jika tidak tersedia di versi modern
        makeWALegacySocket,

        // ── Message helpers ───────────────────────────────────
        generateForwardMessageContent:  get('generateForwardMessageContent'),
        prepareWAMessageMedia:          get('prepareWAMessageMedia'),
        generateWAMessageFromContent:   get('generateWAMessageFromContent'),
        generateMessageID:              get('generateMessageID'),
        downloadContentFromMessage:     get('downloadContentFromMessage'),
        extractMessageContent:          get('extractMessageContent'),

        // ── JID utilities ─────────────────────────────────────
        jidDecode:          get('jidDecode'),
        areJidsSameUser:    get('areJidsSameUser'),
        getBinaryNodeChild: get('getBinaryNodeChild'),
        S_WHATSAPP_NET:     get('S_WHATSAPP_NET'),
        getDevice:          get('getDevice'),

        // ── Proto & Types ─────────────────────────────────────
        proto:              get('proto'),
        // [FIX] WAMessageStubType — satu definisi, nilai benar
        WAMessageStubType,
        WA_DEFAULT_EPHEMERAL: get('WA_DEFAULT_EPHEMERAL'),

        // ── Deprecated — mungkin null di versi modern ─────────
        // Gunakan dengan guard: if (MessageType) { ... }
        MessageType:              get('MessageType'),
        generateWAMessageContent: get('generateWAMessageContent'),
        generateWAMessage:        get('generateWAMessage'),
    };
};
