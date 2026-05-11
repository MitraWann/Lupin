export const loadBaileys = async () => {
    const baileys = await import('@whiskeysockets/baileys');

    const get = (key) => baileys[key] ?? null;

    return {
        // Auth & Connection
        useMultiFileAuthState:       get('useMultiFileAuthState'),
        DisconnectReason:            get('DisconnectReason'),
        fetchLatestBaileysVersion:   get('fetchLatestBaileysVersion'),
        makeCacheableSignalKeyStore: get('makeCacheableSignalKeyStore'),
        makeInMemoryStore:           get('makeInMemoryStore'),
        Browsers:                    get('Browsers'),

        // Socket
        makeWASocket:              get('makeWASocket') ?? baileys.default ?? null,
        makeWALegacySocket:        null, // Dihapus di Baileys v7+

        // Message helpers
        generateForwardMessageContent: get('generateForwardMessageContent'),
        prepareWAMessageMedia:         get('prepareWAMessageMedia'),
        generateWAMessageFromContent:  get('generateWAMessageFromContent'),
        generateMessageID:             get('generateMessageID'),
        downloadContentFromMessage:    get('downloadContentFromMessage'),
        extractMessageContent:         get('extractMessageContent'),

        // JID utilities
        jidDecode:          get('jidDecode'),
        areJidsSameUser:    get('areJidsSameUser'),
        getBinaryNodeChild: get('getBinaryNodeChild'),
        S_WHATSAPP_NET:     get('S_WHATSAPP_NET'),
        getDevice:          get('getDevice'),

        // Proto & Types
        proto:                get('proto'),
        WAMessageStubType:    get('WAMessageStubType'),
        WA_DEFAULT_EPHEMERAL: get('WA_DEFAULT_EPHEMERAL'),

        // Deprecated — di-set null, tidak ada warning
        MessageType:              null,
        generateWAMessageContent: null,
        generateWAMessage:        null,
    };
};