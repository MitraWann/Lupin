/**
 * Builder library for WhatsApp interactive messages
 * and AI rich response payloads using Baileys.
 *
 * Original by Nixel — wa.me/6282139672290
 * VERSION: 4.0 (WAProto expansion)
 *
 * Perubahan dari v3.1 → v4.0:
 *  ── AIRich (fitur baru dari WAProto) ──
 *  - AIRich: addInlineImage()  → gambar inline dengan alignment & tapLink (type 3)
 *  - AIRich: addDynamic()      → GIF animasi atau gambar dinamis (type 6)
 *  - AIRich: addMap()          → peta interaktif dengan anotasi marker (type 7)
 *  - AIRich: addLatex()        → rumus matematika LaTeX (type 8)
 *  ── Button (fitur baru dari WAProto) ──
 *  - Button: setAudioFooter()  → footer dengan pesan audio
 *  - Button: setThumbnail()    → header gambar langsung dari Buffer/bytes
 *  - Button: addCarousel()     → kartu carousel horizontal (CarouselMessage)
 *  - Carousel: class helper    → membangun card carousel satu per satu
 */

'use strict'

const crypto = require('crypto')

// ── Load Baileys via loader yang sudah ada ────────────────────────────────────
let _baileys = null
const _baileysReady = (async () => {
    const { loadBaileys } = await import('../baileys-loader.mjs')
    _baileys = await loadBaileys()
})().catch(err => {
    console.error('[MessageBuilder] Gagal load Baileys:', err)
})

async function getBaileys() {
    if (!_baileys) await _baileysReady
    return _baileys
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Class untuk membangun pesan interaktif WhatsApp (tombol, list, URL, dsb.)
 */
class Button {
    constructor() {
        this._title                 = ''
        this._subtitle              = ''
        this._body                  = ''
        this._footer                = ''
        this._beton                 = []   // tombol format baru (interactive)
        this._betonOld              = []   // tombol format lama (V2/buttonsMessage)
        this._data                  = null // media attachment header
        this._audioFooter           = null // [v4.0] audio di footer
        this._contextInfo           = {}
        this._params                = {}
        this._currentSelectionIndex = -1
        this._currentSectionIndex   = -1
        this._type                  = 0   // 0 = interactive, 1 = buttonsMessage lama
        this._carouselCards         = []   // [v4.0] kartu carousel
        this._carouselType          = 1   // [v4.0] 1=HSCROLL_CARDS, 2=ALBUM_IMAGE
        this._isCarousel            = false
    }

    // ── Media Header ──────────────────────────────────────────────────────────

    setVideo(path, options = {}) {
        if (!path) return new Error('Url or buffer needed')
        this._data = Buffer.isBuffer(path)
            ? { video: path, ...options }
            : { video: { url: path }, ...options }
        return this
    }

    setImage(path, options = {}) {
        if (!path) return new Error('Url or buffer needed')
        this._data = Buffer.isBuffer(path)
            ? { image: path, ...options }
            : { image: { url: path }, ...options }
        return this
    }

    setDocument(path, options = {}) {
        if (!path) return new Error('Url or buffer needed')
        this._data = Buffer.isBuffer(path)
            ? { document: path, ...options }
            : { document: { url: path }, ...options }
        return this
    }

    setMedia(obj) {
        if (typeof obj === 'object' && !Array.isArray(obj)) {
            this._data = obj
            return this
        }
        return 'Type of media must be an Object'
    }

    /**
     * [v4.0] Set gambar header langsung dari Buffer/bytes (jpegThumbnail).
     * Tidak perlu upload ke server — cocok untuk gambar kecil/thumbnail.
     * @param {Buffer} buffer - Buffer gambar JPEG
     */
    setThumbnail(buffer) {
        if (!Buffer.isBuffer(buffer)) return new Error('setThumbnail membutuhkan Buffer')
        this._data = { jpegThumbnail: buffer }
        return this
    }

    /**
     * [v4.0] Tambahkan audio di footer pesan interaktif.
     * Sesuai proto: InteractiveMessage.Footer.audioMessage
     * @param {string|Buffer} path - URL atau Buffer audio
     * @param {object} options     - Opsi tambahan (mimetype, ptt, dll)
     */
    setAudioFooter(path, options = {}) {
        if (!path) return new Error('Url or buffer needed')
        this._audioFooter = Buffer.isBuffer(path)
            ? { audio: path, ...options }
            : { audio: { url: path }, ...options }
        return this
    }

    // ── Teks ──────────────────────────────────────────────────────────────────

    setTitle(title)       { this._title    = title;    return this }
    setSubtitle(subtitle) { this._subtitle = subtitle; return this }
    setBody(body)         { this._body     = body;     return this }
    setFooter(footer)     { this._footer   = footer;   return this }

    setContextInfo(obj) {
        if (typeof obj === 'object' && !Array.isArray(obj)) {
            this._contextInfo = obj
            return this
        }
        return 'Type of contextInfo must be an Object'
    }

    setParams(obj) {
        if (typeof obj === 'object' && !Array.isArray(obj)) {
            this._params = obj
            return this
        }
        return 'Type of params must be an Object'
    }

    setVariabel(name, value) {
        if (!Object.prototype.hasOwnProperty.call(this, name))
            return `Cannot find variabel ${name}, try getVariabelList()`
        this[name] = value
        return this
    }

    getVariabel(name) {
        if (!Object.prototype.hasOwnProperty.call(this, name))
            return `Cannot find variabel ${name}, try getVariabelList()`
        return this[name]
    }

    getVariabelList() { return Object.keys(this) }

    // ── Tombol ────────────────────────────────────────────────────────────────

    setButton(name, params) {
        this._beton.push({ name, buttonParamsJson: JSON.stringify(params) })
        return this
    }

    setButtonV2(params) {
        this._betonOld.push(params)
        return this
    }

    addSelection(title) {
        this._beton.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({ title, sections: [] })
        })
        this._currentSelectionIndex = this._beton.length - 1
        this._currentSectionIndex   = -1
        return this
    }

    makeSections(title = '', highlight_label = '') {
        if (this._currentSelectionIndex === -1)
            throw new Error('You need to create a selection first')
        const params = JSON.parse(this._beton[this._currentSelectionIndex].buttonParamsJson)
        params.sections.push({ title, highlight_label, rows: [] })
        this._currentSectionIndex = params.sections.length - 1
        this._beton[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(params)
        return this
    }

    makeRow(header = '', title = '', description = '', id = '') {
        if (this._currentSelectionIndex === -1 || this._currentSectionIndex === -1)
            throw new Error('You need to create a selection and a section first')
        const params = JSON.parse(this._beton[this._currentSelectionIndex].buttonParamsJson)
        params.sections[this._currentSectionIndex].rows.push({ header, title, description, id })
        this._beton[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(params)
        return this
    }

    addReply(display_text = '', id = '') {
        this._beton.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addReplyV2(displayText = '', buttonId = '') {
        this._betonOld.push({ buttonId, buttonText: { displayText }, type: 1 })
        this._type = 1
        return this
    }

    addCall(display_text = '', id = '') {
        this._beton.push({ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addReminder(display_text = '', id = '') {
        this._beton.push({ name: 'cta_reminder', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addCancelReminder(display_text = '', id = '') {
        this._beton.push({ name: 'cta_cancel_reminder', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addAddress(display_text = '', id = '') {
        this._beton.push({ name: 'address_message', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addLocation() {
        this._beton.push({ name: 'send_location', buttonParamsJson: '' })
        return this
    }

    addUrl(display_text = '', url = '', webview_interaction = false) {
        this._beton.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction })
        })
        return this
    }

    addCopy(display_text = '', copy_code = '', id = '') {
        this._beton.push({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text, copy_code, id })
        })
        return this
    }

    // ── [v4.0] Carousel ───────────────────────────────────────────────────────

    /**
     * [v4.0] Tambahkan kartu ke carousel dari instance Carousel.
     * Sesuai proto: InteractiveMessage.CarouselMessage
     *
     * @param {Carousel} card         - Instance class Carousel
     * @param {'hscroll'|'album'} type - Tipe carousel (default: 'hscroll')
     *
     * @example
     * const card1 = new Carousel()
     *   .setTitle('Produk A').setBody('Harga: Rp 50.000')
     *   .setImage('https://...')
     *   .addReply('Beli', 'beli_a')
     *   .addUrl('Detail', 'https://...')
     *
     * await new Button()
     *   .setBody('Pilih produk favoritmu:')
     *   .addCarousel(card1, 'hscroll')
     *   .addCarousel(card2, 'hscroll')
     *   .run(jid, conn, quoted)
     */
    addCarousel(card, type = 'hscroll') {
        if (!(card instanceof Carousel))
            throw new Error('addCarousel membutuhkan instance class Carousel')
        this._isCarousel  = true
        this._carouselType = type === 'album' ? 2 : 1
        this._carouselCards.push(card)
        return this
    }

    // ── Params Reference ──────────────────────────────────────────────────────

    paramsList() {
        return {
            limited_time_offer:       { text: 'string', url: 'string', copy_code: 'string', expiration_time: 'number' },
            bottom_sheet:             { in_thread_buttons_limit: 'number', divider_indices: ['number'], list_title: 'string', button_title: 'string' },
            tap_target_configuration: { title: 'string', description: 'string', canonical_url: 'string', domain: 'string', buttonIndex: 'number' }
        }
    }

    // ── run() ─────────────────────────────────────────────────────────────────

    /**
     * Kirim pesan interaktif.
     * @param {string} jid
     * @param {object} conn
     * @param {object} quoted
     * @param {object} options  bypass=true → paksa render di klien yang di-patch
     */
    async run(jid, conn, quoted = '', { bypass = false, ...options } = {}) {
        const { generateWAMessageFromContent, prepareWAMessageMedia } = await getBaileys()

        // ── Mode Carousel ─────────────────────────────────────────────────────
        if (this._isCarousel) {
            const cards = await Promise.all(
                this._carouselCards.map(card => card._buildCard(conn, prepareWAMessageMedia))
            )

            const msg = generateWAMessageFromContent(jid, {
                interactiveMessage: {
                    body:        { text: this._body },
                    footer:      { text: this._footer },
                    contextInfo: this._contextInfo,
                    carouselMessage: {
                        cards,
                        messageVersion: 1,
                        carouselCardType: this._carouselType
                    }
                }
            }, { quoted })

            await conn.relayMessage(msg.key.remoteJid, msg.message, {
                messageId: msg.key.id,
                additionalNodes: [{
                    tag: 'biz', attrs: {},
                    content: [{
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                    }]
                }],
                ...options
            })

            return msg
        }

        // ── Mode Interactive (type 0) ──────────────────────────────────────────
        if (this._type === 0) {
            // Siapkan media header
            let headerMedia = {}
            if (this._data) {
                // jpegThumbnail tidak perlu upload — langsung pakai
                if (this._data.jpegThumbnail) {
                    headerMedia = { jpegThumbnail: this._data.jpegThumbnail }
                } else {
                    headerMedia = await prepareWAMessageMedia(this._data, { upload: conn.waUploadToServer })
                }
            }

            // Siapkan audio footer jika ada
            let footerAudio = {}
            if (this._audioFooter) {
                const prepared = await prepareWAMessageMedia(this._audioFooter, { upload: conn.waUploadToServer })
                footerAudio = { audioMessage: prepared.audioMessage }
            }

            const message = {
                body:   { text: this._body },
                footer: { text: this._footer, ...footerAudio },
                header: {
                    title:              this._title,
                    subtitle:           this._subtitle,
                    hasMediaAttachment: !!this._data,
                    ...headerMedia
                }
            }

            const msg = generateWAMessageFromContent(jid, {
                interactiveMessage: {
                    ...message,
                    contextInfo: this._contextInfo,
                    nativeFlowMessage: {
                        messageParamsJson: JSON.stringify(this._params),
                        buttons:           this._beton
                    }
                }
            }, { quoted })

            await conn.relayMessage(msg.key.remoteJid, msg.message, {
                messageId: msg.key.id,
                additionalNodes: [{
                    tag: 'biz', attrs: {},
                    content: [{
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                    }]
                }],
                ...options
            })

            return msg

        // ── Mode buttonsMessage lama (type 1) ─────────────────────────────────
        } else {
            const msg = generateWAMessageFromContent(jid, {
                buttonsMessage: {
                    ...(this._data || {}),
                    [this._data ? 'caption' : 'contentText']: this._body,
                    title:       this._data ? null : this._title,
                    footerText:  this._footer,
                    ...(bypass ? { headerType: 6, locationMessage: {} } : {}),
                    viewOnce:    true,
                    contextInfo: this._contextInfo,
                    buttons: [
                        ...this._betonOld,
                        ...this._beton.map(b => ({
                            buttonId:       'id',
                            buttonText:     { displayText: b.name },
                            type:           1,
                            nativeFlowInfo: { name: b.name, paramsJson: b.buttonParamsJson }
                        }))
                    ]
                }
            }, { quoted, ...options })

            await conn.relayMessage(msg.key.remoteJid, msg.message, {
                messageId: msg.key.id,
                additionalNodes: [{
                    tag: 'biz', attrs: {},
                    content: [{
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                    }]
                }],
                ...options
            })

            return msg
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * [v4.0] Class helper untuk membangun satu kartu di dalam CarouselMessage.
 * Setiap instance Carousel = satu card yang bisa punya header, body, footer,
 * dan tombol-tombol sendiri.
 *
 * @example
 * const card = new Carousel()
 *   .setTitle('Produk A')
 *   .setBody('Rp 50.000')
 *   .setImage('https://...')
 *   .addReply('Beli', 'beli_a')
 *   .addUrl('Lihat Detail', 'https://...')
 */
class Carousel {
    constructor() {
        this._title    = ''
        this._subtitle = ''
        this._body     = ''
        this._footer   = ''
        this._data     = null
        this._buttons  = []
    }

    setTitle(title)       { this._title    = title;    return this }
    setSubtitle(subtitle) { this._subtitle = subtitle; return this }
    setBody(body)         { this._body     = body;     return this }
    setFooter(footer)     { this._footer   = footer;   return this }

    setImage(path, options = {}) {
        this._data = Buffer.isBuffer(path)
            ? { image: path, ...options }
            : { image: { url: path }, ...options }
        return this
    }

    setVideo(path, options = {}) {
        this._data = Buffer.isBuffer(path)
            ? { video: path, ...options }
            : { video: { url: path }, ...options }
        return this
    }

    addReply(display_text = '', id = '') {
        this._buttons.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addUrl(display_text = '', url = '', webview_interaction = false) {
        this._buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction })
        })
        return this
    }

    addCopy(display_text = '', copy_code = '', id = '') {
        this._buttons.push({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text, copy_code, id })
        })
        return this
    }

    /** @internal Dipanggil oleh Button.run() untuk build payload card */
    async _buildCard(conn, prepareWAMessageMedia) {
        let headerMedia = {}
        if (this._data) {
            headerMedia = await prepareWAMessageMedia(this._data, { upload: conn.waUploadToServer })
        }

        return {
            body:   { text: this._body },
            footer: { text: this._footer },
            header: {
                title:              this._title,
                subtitle:           this._subtitle,
                hasMediaAttachment: !!this._data,
                ...headerMedia
            },
            nativeFlowMessage: {
                buttons: this._buttons
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Class untuk membangun pesan Rich AI (teks, kode, tabel, gambar, reels, sumber, dll.)
 */
class AIRich {
    constructor() {
        this._submessages         = []
        this._sections            = []
        this._richResponseSources = []
    }

    // ── Fitur Lama (v3.1) ─────────────────────────────────────────────────────

    addText(text) {
        this._submessages.push({ messageType: 2, messageText: text })
        this._sections.push({
            view_model: {
                primitive: { text, __typename: 'GenAIMarkdownTextUXPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addCode(language, code) {
        const meta = this.tokenizer(code, language)
        this._submessages.push({
            messageType: 5,
            codeMetadata: { codeLanguage: language, codeBlocks: meta.codeBlock }
        })
        this._sections.push({
            view_model: {
                primitive: { language, code_blocks: meta.unified_codeBlock, __typename: 'GenAICodeUXPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addTable(table) {
        const meta = this.toTableMetadata(table)
        this._submessages.push({
            messageType: 4,
            tableMetadata: { title: meta.title, rows: meta.rows }
        })
        this._sections.push({
            view_model: {
                primitive: { rows: meta.unified_rows, __typename: 'GenATableUXPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addSource(sources = []) {
        const source = sources.map(([profile_url, url, text]) => ({
            source_type:         'THIRD_PARTY',
            source_display_name: text,
            source_subtitle:     'AI',
            source_url:          url,
            favicon: { url: profile_url, mime_type: 'image/jpeg', width: 16, height: 16 }
        }))
        this._sections.push({
            view_model: {
                primitive: { sources: source, __typename: 'GenAISearchResultPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addReels(reelsItems = []) {
        this._submessages.push({
            messageType: 9,
            contentItemsMetadata: {
                contentType:   1,
                itemsMetadata: reelsItems.map(item => ({
                    reelItem: {
                        title:          item.title,
                        profileIconUrl: item.profileIconUrl,
                        thumbnailUrl:   item.thumbnailUrl,
                        videoUrl:       item.videoUrl
                    }
                }))
            }
        })

        reelsItems.forEach((item, idx) => {
            this._richResponseSources.push({
                provider:          'UNKNOWN',
                thumbnailCDNURL:   item.thumbnailUrl,
                sourceProviderURL: item.videoUrl,
                sourceQuery:       '',
                faviconCDNURL:     item.profileIconUrl,
                citationNumber:    idx + 1,
                sourceTitle:       item.title
            })
        })

        this._sections.push({
            view_model: {
                primitives: reelsItems.map(item => ({
                    reels_url:     item.videoUrl,
                    thumbnail_url: item.thumbnailUrl,
                    creator:       item.title,
                    avatar_url:    item.profileIconUrl,
                    reels_title:   item.reels_title,
                    likes_count:   0,
                    shares_count:  0,
                    view_count:    0,
                    reel_source:   'IG',
                    is_verified:   item.is_verified,
                    __typename:    'GenAIReelPrimitive'
                })),
                __typename: 'GenAIHScrollLayoutViewModel'
            }
        })

        return this
    }

    addImage(imageUrl) {
        const imageUrls = Array.isArray(imageUrl)
            ? imageUrl.map(url => ({ imagePreviewUrl: url, sourceUrl: 'https://google.com' }))
            : [{ imagePreviewUrl: imageUrl, sourceUrl: 'https://google.com' }]

        this._submessages.push({
            messageType: 1,
            gridImageMetadata: {
                gridImageUrl: { imagePreviewUrl: Array.isArray(imageUrl) ? imageUrl[0] : imageUrl },
                imageUrls
            }
        })

        imageUrls.forEach(({ imagePreviewUrl }) => {
            this._sections.push({
                view_model: {
                    primitive: {
                        media:        { url: imagePreviewUrl, mime_type: 'image/jpeg' },
                        imagine_type: 3,
                        status:       { status: 'READY' },
                        __typename:   'GenAIImaginePrimitive'
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            })
        })

        return this
    }

    // ── [v4.0] Fitur Baru dari WAProto ────────────────────────────────────────

    /**
     * [v4.0] Gambar inline dengan alignment dan link saat diklik.
     * Sesuai proto: AIRichResponseInlineImageMetadata (type 3)
     *
     * @param {string} imageUrl    - URL gambar
     * @param {object} options
     * @param {string} options.imageText      - Teks caption di bawah gambar
     * @param {string} options.highResUrl     - URL gambar resolusi tinggi (opsional)
     * @param {string} options.sourceUrl      - URL sumber gambar (opsional)
     * @param {'left'|'center'|'right'} options.alignment - Posisi gambar (default: 'center')
     * @param {string} options.tapLinkUrl     - URL yang dibuka saat gambar diklik (opsional)
     *
     * @example
     * .addInlineImage('https://example.com/foto.jpg', {
     *   imageText: 'Ini adalah foto contoh',
     *   alignment: 'center',
     *   tapLinkUrl: 'https://example.com'
     * })
     */
    addInlineImage(imageUrl, { imageText = '', highResUrl = '', sourceUrl = '', alignment = 'center', tapLinkUrl = '' } = {}) {
        const ALIGNMENT_MAP = { left: 0, right: 1, center: 2 }
        const alignVal = ALIGNMENT_MAP[alignment] ?? 2

        this._submessages.push({
            messageType: 3,
            imageMetadata: {
                imageUrl: {
                    imagePreviewUrl: imageUrl,
                    ...(highResUrl  ? { imageHighResUrl: highResUrl } : {}),
                    ...(sourceUrl   ? { sourceUrl }                  : {})
                },
                ...(imageText  ? { imageText }        : {}),
                alignment:       alignVal,
                ...(tapLinkUrl ? { tapLinkUrl }       : {})
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    media: {
                        url:       imageUrl,
                        mime_type: 'image/jpeg'
                    },
                    caption:    imageText,
                    alignment:  alignment,
                    tap_url:    tapLinkUrl,
                    __typename: 'GenAIInlineImageUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    /**
     * [v4.0] Gambar dinamis atau GIF animasi.
     * Sesuai proto: AIRichResponseDynamicMetadata (type 6)
     *
     * @param {string} url                - URL gambar atau GIF
     * @param {'image'|'gif'} type        - Tipe konten (default: 'image')
     * @param {number} loopCount          - Jumlah perulangan GIF (default: 0 = loop selamanya)
     * @param {number} version            - Versi metadata (default: 1)
     *
     * @example
     * .addDynamic('https://example.com/animasi.gif', 'gif', 3)
     * .addDynamic('https://example.com/gambar.jpg', 'image')
     */
    addDynamic(url, type = 'image', loopCount = 0, version = 1) {
        const TYPE_MAP = { image: 1, gif: 2 }
        const typeVal  = TYPE_MAP[type] ?? 1

        this._submessages.push({
            messageType: 6,
            dynamicMetadata: {
                type:      typeVal,
                version,
                url,
                loopCount
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    url,
                    media_type:  type,
                    loop_count:  loopCount,
                    __typename: 'GenAIDynamicMediaUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    /**
     * [v4.0] Peta interaktif dengan marker/anotasi lokasi.
     * Sesuai proto: AIRichResponseMapMetadata (type 7)
     *
     * @param {object} center - Koordinat pusat peta
     * @param {number} center.latitude  - Latitude pusat
     * @param {number} center.longitude - Longitude pusat
     * @param {number} center.latDelta  - Delta latitude (zoom, default: 0.05)
     * @param {number} center.lngDelta  - Delta longitude (zoom, default: 0.05)
     * @param {Array}  annotations      - Array marker: [{ lat, lng, title, body }]
     * @param {boolean} showInfoList    - Tampilkan daftar info di bawah peta (default: true)
     *
     * @example
     * .addMap(
     *   { latitude: -5.1477, longitude: 119.4327 },
     *   [
     *     { lat: -5.1477, lng: 119.4327, title: 'Makassar', body: 'Ibu kota Sulsel' },
     *     { lat: -5.15,   lng: 119.44,   title: 'Fort Rotterdam', body: 'Benteng bersejarah' }
     *   ]
     * )
     */
    addMap(center = {}, annotations = [], showInfoList = true) {
        const {
            latitude  = 0,
            longitude = 0,
            latDelta  = 0.05,
            lngDelta  = 0.05
        } = center

        const annotationList = annotations.map((a, idx) => ({
            annotationNumber: idx + 1,
            latitude:         a.lat ?? a.latitude ?? 0,
            longitude:        a.lng ?? a.longitude ?? 0,
            title:            a.title ?? '',
            body:             a.body ?? ''
        }))

        this._submessages.push({
            messageType: 7,
            mapMetadata: {
                centerLatitude:  latitude,
                centerLongitude: longitude,
                latitudeDelta:   latDelta,
                longitudeDelta:  lngDelta,
                annotations:     annotationList,
                showInfoList
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    center_lat:   latitude,
                    center_lng:   longitude,
                    lat_delta:    latDelta,
                    lng_delta:    lngDelta,
                    annotations:  annotationList.map(a => ({
                        number:   a.annotationNumber,
                        lat:      a.latitude,
                        lng:      a.longitude,
                        title:    a.title,
                        body:     a.body
                    })),
                    show_info:    showInfoList,
                    __typename:   'GenAIMapUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    /**
     * [v4.0] Rumus matematika LaTeX.
     * Sesuai proto: AIRichResponseLatexMetadata (type 8)
     *
     * Setiap ekspresi LaTeX dirender sebagai gambar dari URL yang kamu sediakan
     * (bisa gunakan layanan seperti https://latex.codecogs.com/png.image?).
     *
     * @param {string} introText    - Teks pengantar sebelum rumus
     * @param {Array}  expressions  - Array ekspresi:
     *   [{ latex, url, width, height, fontHeight }]
     *
     * @example
     * .addLatex('Rumus luas lingkaran:', [
     *   {
     *     latex: 'A = \\pi r^2',
     *     url: 'https://latex.codecogs.com/png.image?A%20%3D%20%5Cpi%20r%5E2',
     *     width: 120, height: 40, fontHeight: 14
     *   }
     * ])
     */
    addLatex(introText = '', expressions = []) {
        const exprList = expressions.map(e => ({
            latexExpression:     e.latex ?? '',
            url:                 e.url ?? '',
            width:               e.width ?? 200,
            height:              e.height ?? 50,
            fontHeight:          e.fontHeight ?? 14,
            imageTopPadding:     e.topPadding ?? 4,
            imageLeadingPadding: e.leadingPadding ?? 4,
            imageBottomPadding:  e.bottomPadding ?? 4,
            imageTrailingPadding:e.trailingPadding ?? 4
        }))

        this._submessages.push({
            messageType: 8,
            latexMetadata: {
                text:        introText,
                expressions: exprList
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    intro_text:  introText,
                    expressions: exprList.map(e => ({
                        latex:  e.latexExpression,
                        url:    e.url,
                        width:  e.width,
                        height: e.height
                    })),
                    __typename: 'GenAILatexUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    // ── Build & Run ───────────────────────────────────────────────────────────

    build({ forwarded = true, includesUnifiedResponse = true } = {}) {
        const contextInfo = forwarded ? {
            forwardingScore: 1,
            isForwarded:     true,
            forwardedAiBotMessageInfo: { botJid: '0@bot' },
            forwardOrigin:   4
        } : {}

        return {
            messageContextInfo: {
                deviceListMetadata:        {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    pluginMetadata:              {},
                    richResponseSourcesMetadata: { sources: this._richResponseSources }
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType:  1,
                        submessages:  this._submessages,
                        unifiedResponse: {
                            data: includesUnifiedResponse
                                ? Buffer.from(JSON.stringify({
                                    response_id: crypto.randomUUID(),
                                    sections:    this._sections
                                  })).toString('base64')
                                : ''
                        },
                        contextInfo
                    }
                }
            }
        }
    }

    async run(chat, conn, { forwarded, includesUnifiedResponse, ...options } = {}) {
        const payload = this.build({ forwarded, includesUnifiedResponse })
        return await conn.relayMessage(chat, payload, { ...options })
    }

    // ── Helper Internal ───────────────────────────────────────────────────────

    tokenizer(code, lang = 'javascript') {
        const keywordsMap = {
            javascript: new Set([
                'break','case','catch','continue','debugger','delete','do','else','finally',
                'for','function','if','in','instanceof','new','return','switch','this','throw',
                'try','typeof','var','void','while','with','true','false','null','undefined',
                'class','const','let','super','extends','export','import','yield','static',
                'constructor','async','await','get','set'
            ])
        }
        const TYPE_MAP = { 0: 'DEFAULT', 1: 'KEYWORD', 2: 'METHOD', 3: 'STR', 4: 'NUMBER', 5: 'COMMENT' }
        const keywords = keywordsMap[lang] || new Set()
        const tokens   = []
        let i = 0

        const push = (content, type) => {
            if (!content) return
            const last = tokens[tokens.length - 1]
            if (last && last.highlightType === type) last.codeContent += content
            else tokens.push({ codeContent: content, highlightType: type })
        }

        while (i < code.length) {
            const c = code[i]
            if (/\s/.test(c)) {
                let s = i; while (i < code.length && /\s/.test(code[i])) i++
                push(code.slice(s, i), 0); continue
            }
            if (c === '/' && code[i + 1] === '/') {
                let s = i; i += 2
                while (i < code.length && code[i] !== '\n') i++
                push(code.slice(s, i), 5); continue
            }
            if (c === '"' || c === "'" || c === '`') {
                let s = i; const q = c; i++
                while (i < code.length) {
                    if (code[i] === '\\' && i + 1 < code.length) i += 2
                    else if (code[i] === q) { i++; break }
                    else i++
                }
                push(code.slice(s, i), 3); continue
            }
            if (/[0-9]/.test(c)) {
                let s = i; while (i < code.length && /[0-9.]/.test(code[i])) i++
                push(code.slice(s, i), 4); continue
            }
            if (/[a-zA-Z_$]/.test(c)) {
                let s = i; while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++
                const word = code.slice(s, i)
                let type = 0
                if (keywords.has(word)) type = 1
                else {
                    let j = i
                    while (j < code.length && /\s/.test(code[j])) j++
                    if (code[j] === '(') type = 2
                }
                push(word, type); continue
            }
            push(c, 0); i++
        }

        return {
            codeBlock:         tokens,
            unified_codeBlock: tokens.map(t => ({ content: t.codeContent, type: TYPE_MAP[t.highlightType] }))
        }
    }

    toTableMetadata(arr) {
        if (!Array.isArray(arr) || arr.length < 2)
            throw new Error('Format tabel ngawur')
        const [header, ...rows] = arr
        const maxLen    = Math.max(header.length, ...rows.map(r => r.length))
        const normalize = r => [...r, ...Array(maxLen - r.length).fill('')]
        const unified_rows = [
            { is_header: true,  cells: normalize(header) },
            ...rows.map(r => ({ is_header: false, cells: normalize(r) }))
        ]
        return {
            title:       '',
            rows:        unified_rows.map(r => ({ items: r.cells, ...(r.is_header ? { isHeading: true } : {}) })),
            unified_rows
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { Button, Carousel, AIRich }