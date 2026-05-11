/**
 * Builder library for WhatsApp interactive messages
 * and AI rich response payloads using Baileys.
 *
 * Original by Nixel — wa.me/6282139672290
 * VERSION: 4.1 (Enhanced with validation, error handling, analytics)
 *
 * Perubahan dari v3.1 → v4.0 → v4.1:
 *  ── AIRich (fitur dari WAProto) ──
 *  - AIRich: addInlineImage()  → gambar inline dengan alignment & tapLink (type 3)
 *  - AIRich: addDynamic()      → GIF animasi atau gambar dinamis (type 6)
 *  - AIRich: addMap()          → peta interaktif dengan anotasi marker (type 7)
 *  - AIRich: addLatex()        → rumus matematika LaTeX (type 8)
 *  ── Button (fitur dari WAProto) ──
 *  - Button: setAudioFooter()  → footer dengan pesan audio
 *  - Button: setThumbnail()    → header gambar langsung dari Buffer/bytes
 *  - Button: addCarousel()     → kartu carousel horizontal (CarouselMessage)
 *  - Carousel: class helper    → membangun card carousel satu per satu
 *  ── v4.1 NEW FEATURES ──
 *  - ValidationError class     → error handling yang lebih baik
 *  - Input validation          → validasi ketat pada semua input
 *  - Tracking & Analytics      → tracking message dan analytics support
 *  - Retry logic              → auto-retry dengan timeout
 *  - Timeout support          → configurable timeout per message
 *  - Card ID & metadata        → custom metadata di carousel cards
 *  - Type safety              → message type constants
 */

'use strict'

const crypto = require('crypto')

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom Error untuk validation issues
 */
class ValidationError extends Error {
    constructor(message) {
        super(`[ValidationError] ${message}`)
        this.name = 'ValidationError'
        this.isValidationError = true
    }
}

/**
 * Custom Error untuk operational issues
 */
class OperationalError extends Error {
    constructor(message) {
        super(`[OperationalError] ${message}`)
        this.name = 'OperationalError'
        this.isOperationalError = true
    }
}

/**
 * Validators utility object
 */
const Validators = {
    isValidUrl: (url) => {
        if (typeof url !== 'string') return false
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    },

    isValidJid: (jid) => {
    if (typeof jid !== 'string') return false
    return /^\d+@(c|g|s\.whatsapp|broadcast|lid)$/.test(jid)
	},

    isValidBuffer: (buf) => Buffer.isBuffer(buf),

    isValidLatitude: (lat) => {
        const num = parseFloat(lat)
        return !isNaN(num) && num >= -90 && num <= 90
    },

    isValidLongitude: (lng) => {
        const num = parseFloat(lng)
        return !isNaN(num) && num >= -180 && num <= 180
    },

    isValidPhoneNumber: (phone) => {
        if (typeof phone !== 'string') return false
        return /^\d{7,15}$/.test(phone.replace(/\D/g, ''))
    },

    isValidHexColor: (color) => /^#[0-9A-F]{6}$/i.test(color),

    isNonEmptyString: (str) => typeof str === 'string' && str.trim().length > 0,

    isPositiveNumber: (num) => typeof num === 'number' && num > 0,

    isNonNegativeNumber: (num) => typeof num === 'number' && num >= 0
}

// ─────────────────────────────────────────────────────────────────────────────
// BAILEYS LOADER
// ─────────────────────────────────────────────────────────────────────────────

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
// BUTTON CLASS
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
        this._beton                 = []
        this._betonOld              = []
        this._data                  = null
        this._audioFooter           = null
        this._contextInfo           = {}
        this._params                = {}
        this._currentSelectionIndex = -1
        this._currentSectionIndex   = -1
        this._type                  = 0
        this._carouselCards         = []
        this._carouselType          = 1
        this._isCarousel            = false

        // [v4.1] Tracking & Analytics
        this._trackingId            = null
        this._analyticsData         = {}
        this._messageId             = null
        this._createdAt             = new Date()

        // [v4.1] Metadata
        this._messageMetadata       = {}
    }

    // ── VALIDATION HELPERS ────────────────────────────────────────────────────

    _validateNotEmpty(value, fieldName) {
        if (!value) throw new ValidationError(`${fieldName} tidak boleh kosong`)
        return value
    }

    _validateUrl(url, fieldName = 'URL') {
        if (!Validators.isValidUrl(url)) {
            throw new ValidationError(`${fieldName} tidak valid: ${url}`)
        }
        return url
    }

    _validateJid(jid) {
        if (!Validators.isValidJid(jid)) {
            throw new ValidationError(`JID tidak valid: ${jid}`)
        }
        return jid
    }

    // ── MEDIA HEADER ──────────────────────────────────────────────────────────

    setVideo(path, options = {}) {
        if (!path) throw new ValidationError('URL atau Buffer diperlukan untuk video')

        this._data = Buffer.isBuffer(path)
            ? { video: path, ...options }
            : { video: { url: this._validateUrl(path, 'Video URL') }, ...options }
        return this
    }

    setImage(path, options = {}) {
        if (!path) throw new ValidationError('URL atau Buffer diperlukan untuk gambar')

        this._data = Buffer.isBuffer(path)
            ? { image: path, ...options }
            : { image: { url: this._validateUrl(path, 'Image URL') }, ...options }
        return this
    }

    setDocument(path, options = {}) {
        if (!path) throw new ValidationError('URL atau Buffer diperlukan untuk dokumen')

        this._data = Buffer.isBuffer(path)
            ? { document: path, ...options }
            : { document: { url: this._validateUrl(path, 'Document URL') }, ...options }
        return this
    }

    /**
     * Set media dengan validasi dan caption
     * @param {string|Buffer} media - Media path atau Buffer
     * @param {'image'|'video'|'document'} type - Tipe media
     * @param {string} caption - Caption/description
     */
    setMediaWithCaption(media, type = 'image', caption = '') {
        if (!media) throw new ValidationError('Media path atau Buffer diperlukan')
        if (!['image', 'video', 'document'].includes(type)) {
            throw new ValidationError(`Tipe media tidak valid: ${type}`)
        }

        const mediaObj = Buffer.isBuffer(media)
            ? { [type]: media }
            : { [type]: { url: this._validateUrl(media, `${type} URL`) } }

        this._data = { ...mediaObj, caption }
        return this
    }

    setMedia(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) {
            throw new ValidationError('Media harus berupa Object')
        }
        this._data = obj
        return this
    }

    /**
     * [v4.0] Set gambar header langsung dari Buffer/bytes (jpegThumbnail)
     * @param {Buffer} buffer - Buffer gambar JPEG
     */
    setThumbnail(buffer) {
        if (!Validators.isValidBuffer(buffer)) {
            throw new ValidationError('setThumbnail membutuhkan Buffer JPEG')
        }
        this._data = { jpegThumbnail: buffer }
        return this
    }

    /**
     * [v4.0] Tambahkan audio di footer pesan interaktif
     * @param {string|Buffer} path - URL atau Buffer audio
     * @param {object} options - Opsi tambahan (mimetype, ptt, dll)
     */
    setAudioFooter(path, options = {}) {
        if (!path) throw new ValidationError('URL atau Buffer diperlukan untuk audio')

        this._audioFooter = Buffer.isBuffer(path)
            ? { audio: path, ...options }
            : { audio: { url: this._validateUrl(path, 'Audio URL') }, ...options }
        return this
    }

    // ── TEKS ──────────────────────────────────────────────────────────────────

    setTitle(title) {
        if (title && !Validators.isNonEmptyString(title)) {
            throw new ValidationError('Title harus berupa string')
        }
        if (title && title.length > 100) {
            throw new ValidationError('Title maksimal 100 karakter')
        }
        this._title = title
        return this
    }

    setSubtitle(subtitle) {
        if (subtitle && !Validators.isNonEmptyString(subtitle)) {
            throw new ValidationError('Subtitle harus berupa string')
        }
        if (subtitle && subtitle.length > 100) {
            throw new ValidationError('Subtitle maksimal 100 karakter')
        }
        this._subtitle = subtitle
        return this
    }

    setBody(body) {
        if (!Validators.isNonEmptyString(body)) {
            throw new ValidationError('Body tidak boleh kosong')
        }
        if (body.length > 1024) {
            throw new ValidationError('Body maksimal 1024 karakter')
        }
        this._body = body
        return this
    }

    setFooter(footer) {
        if (footer && !Validators.isNonEmptyString(footer)) {
            throw new ValidationError('Footer harus berupa string')
        }
        if (footer && footer.length > 60) {
            throw new ValidationError('Footer maksimal 60 karakter')
        }
        this._footer = footer
        return this
    }

    setContextInfo(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) {
            throw new ValidationError('ContextInfo harus berupa Object')
        }
        this._contextInfo = obj
        return this
    }

    setParams(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) {
            throw new ValidationError('Params harus berupa Object')
        }
        this._params = obj
        return this
    }

    setVariabel(name, value) {
        if (!Object.prototype.hasOwnProperty.call(this, name)) {
            throw new ValidationError(`Variabel ${name} tidak ditemukan`)
        }
        this[name] = value
        return this
    }

    getVariabel(name) {
        if (!Object.prototype.hasOwnProperty.call(this, name)) {
            throw new ValidationError(`Variabel ${name} tidak ditemukan`)
        }
        return this[name]
    }

    getVariabelList() {
        return Object.keys(this).filter(key => !key.startsWith('_'))
    }

    // ── TOMBOL ────────────────────────────────────────────────────────────────

    setButton(name, params) {
        if (!Validators.isNonEmptyString(name)) {
            throw new ValidationError('Button name tidak boleh kosong')
        }
        if (typeof params !== 'object' || Array.isArray(params)) {
            throw new ValidationError('Button params harus berupa Object')
        }
        this._beton.push({ name, buttonParamsJson: JSON.stringify(params) })
        return this
    }

    setButtonV2(params) {
        if (typeof params !== 'object' || Array.isArray(params)) {
            throw new ValidationError('ButtonV2 params harus berupa Object')
        }
        this._betonOld.push(params)
        return this
    }

    addSelection(title) {
        if (!Validators.isNonEmptyString(title)) {
            throw new ValidationError('Selection title tidak boleh kosong')
        }
        this._beton.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({ title, sections: [] })
        })
        this._currentSelectionIndex = this._beton.length - 1
        this._currentSectionIndex = -1
        return this
    }

    makeSections(title = '', highlight_label = '') {
        if (this._currentSelectionIndex === -1) {
            throw new ValidationError('Buat selection terlebih dahulu sebelum membuat sections')
        }
        const params = JSON.parse(this._beton[this._currentSelectionIndex].buttonParamsJson)
        params.sections.push({ title, highlight_label, rows: [] })
        this._currentSectionIndex = params.sections.length - 1
        this._beton[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(params)
        return this
    }

    makeRow(header = '', title = '', description = '', id = '') {
        if (this._currentSelectionIndex === -1 || this._currentSectionIndex === -1) {
            throw new ValidationError('Buat selection dan section terlebih dahulu')
        }
        const params = JSON.parse(this._beton[this._currentSelectionIndex].buttonParamsJson)
        params.sections[this._currentSectionIndex].rows.push({ header, title, description, id })
        this._beton[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(params)
        return this
    }

    addReply(display_text = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Reply display_text tidak boleh kosong')
        }
        this._beton.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    addReplyV2(displayText = '', buttonId = '') {
        if (!Validators.isNonEmptyString(displayText)) {
            throw new ValidationError('ReplyV2 displayText tidak boleh kosong')
        }
        this._betonOld.push({ buttonId, buttonText: { displayText }, type: 1 })
        this._type = 1
        return this
    }

    addCall(display_text = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Call display_text tidak boleh kosong')
        }
        this._beton.push({
            name: 'cta_call',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    addReminder(display_text = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Reminder display_text tidak boleh kosong')
        }
        this._beton.push({
            name: 'cta_reminder',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    addCancelReminder(display_text = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('CancelReminder display_text tidak boleh kosong')
        }
        this._beton.push({
            name: 'cta_cancel_reminder',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    addAddress(display_text = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Address display_text tidak boleh kosong')
        }
        this._beton.push({
            name: 'address_message',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    addLocation() {
        this._beton.push({ name: 'send_location', buttonParamsJson: '' })
        return this
    }

    addUrl(display_text = '', url = '', webview_interaction = false) {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('URL button display_text tidak boleh kosong')
        }
        if (!Validators.isValidUrl(url)) {
            throw new ValidationError(`URL tidak valid: ${url}`)
        }
        this._beton.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction })
        })
        return this
    }

    addCopy(display_text = '', copy_code = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Copy button display_text tidak boleh kosong')
        }
        if (!Validators.isNonEmptyString(copy_code)) {
            throw new ValidationError('Copy button copy_code tidak boleh kosong')
        }
        this._beton.push({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text, copy_code, id })
        })
        return this
    }

    // ── CAROUSEL ──────────────────────────────────────────────────────────────

    /**
     * [v4.0] Tambahkan kartu ke carousel
     * @param {Carousel} card - Instance class Carousel
     * @param {'hscroll'|'album'} type - Tipe carousel
     */
    addCarousel(card, type = 'hscroll') {
        if (!(card instanceof Carousel)) {
            throw new ValidationError('addCarousel membutuhkan instance class Carousel')
        }
        if (!['hscroll', 'album'].includes(type)) {
            throw new ValidationError(`Tipe carousel tidak valid: ${type}`)
        }
        this._isCarousel = true
        this._carouselType = type === 'album' ? 2 : 1
        this._carouselCards.push(card)
        return this
    }

    // ── TRACKING & ANALYTICS (v4.1) ───────────────────────────────────────────

    /**
     * [v4.1] Set tracking ID untuk message
     * @param {string} id - Tracking ID unik
     */
    setTrackingId(id) {
        if (!Validators.isNonEmptyString(id)) {
            throw new ValidationError('Tracking ID tidak boleh kosong')
        }
        this._trackingId = id
        return this
    }

    /**
     * [v4.1] Set analytics data
     * @param {object} data - Analytics data
     */
    setAnalytics(data = {}) {
        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new ValidationError('Analytics data harus berupa Object')
        }
        this._analyticsData = {
            source: data.source || 'unknown',
            campaign: data.campaign || '',
            customData: data.customData || {}
        }
        return this
    }

    /**
     * [v4.1] Set metadata custom
     * @param {object} metadata - Custom metadata
     */
    setMetadata(metadata = {}) {
        if (typeof metadata !== 'object' || Array.isArray(metadata)) {
            throw new ValidationError('Metadata harus berupa Object')
        }
        this._messageMetadata = metadata
        return this
    }

    // ── PARAMS REFERENCE ──────────────────────────────────────────────────────

    paramsList() {
        return {
            limited_time_offer: {
                text: 'string',
                url: 'string',
                copy_code: 'string',
                expiration_time: 'number'
            },
            bottom_sheet: {
                in_thread_buttons_limit: 'number',
                divider_indices: ['number'],
                list_title: 'string',
                button_title: 'string'
            },
            tap_target_configuration: {
                title: 'string',
                description: 'string',
                canonical_url: 'string',
                domain: 'string',
                buttonIndex: 'number'
            }
        }
    }

    // ── HELPER METHODS ────────────────────────────────────────────────────────

    /**
     * Get total message size (rough estimation)
     */
    getMessageSize() {
        const body = JSON.stringify({
            title: this._title,
            subtitle: this._subtitle,
            body: this._body,
            footer: this._footer,
            buttons: this._beton
        })
        return Buffer.byteLength(body, 'utf-8')
    }

    /**
     * Validate message sebelum dikirim
     */
    validate() {
        if (!Validators.isNonEmptyString(this._body)) {
            throw new ValidationError('Body message tidak boleh kosong')
        }

        const size = this.getMessageSize()
        if (size > 32768) {
            throw new ValidationError(`Message terlalu besar: ${size} bytes (max: 32768)`)
        }

        if (this._beton.length === 0 && this._betonOld.length === 0 && !this._isCarousel) {
            console.warn('[Button.validate] Warning: Pesan tanpa tombol atau carousel')
        }

        return true
    }

    // ── RUN METHOD ────────────────────────────────────────────────────────────

    /**
     * Kirim pesan interaktif dengan retry & timeout support
     * @param {string} jid - JID penerima
     * @param {object} conn - Connection object Baileys
     * @param {object} quoted - Pesan yang di-quote (optional)
     * @param {object} options - Opsi pengiriman
     * @param {boolean} options.bypass - Force render di klien
     * @param {number} options.timeout - Timeout dalam ms (default: 30000)
     * @param {number} options.retry - Jumlah retry (default: 3)
     */
    async run(jid, conn, quoted = '', {
        bypass = false,
        timeout = 30000,
        retry = 3,
        ...options
    } = {}) {
        try {
            // Validasi input
            this._validateJid(jid)
            if (!conn) throw new ValidationError('Connection object tidak ditemukan')
            if (timeout < 1000) throw new ValidationError('Timeout minimal 1000ms')
            if (retry < 1) throw new ValidationError('Retry minimal 1')

            // Validasi message
            this.validate()

            const { generateWAMessageFromContent, prepareWAMessageMedia } = await getBaileys()

            let lastError
            for (let attempt = 1; attempt <= retry; attempt++) {
                try {
                    const result = await Promise.race([
                        this._sendMessage(
                            jid,
                            conn,
                            quoted,
                            generateWAMessageFromContent,
                            prepareWAMessageMedia,
                            bypass,
                            options
                        ),
                        new Promise((_, reject) =>
                            setTimeout(
                                () => reject(new OperationalError('Message send timeout')),
                                timeout
                            )
                        )
                    ])

                    // Log success dengan analytics
                    if (this._analyticsData.source) {
                        console.log(`[Analytics] Message sent successfully`, {
                            jid,
                            tracking: this._trackingId,
                            attempt,
                            duration: Date.now() - this._createdAt.getTime(),
                            analytics: this._analyticsData
                        })
                    }

                    this._messageId = result.key?.id
                    return result
                } catch (err) {
                    lastError = err
                    console.warn(`[Attempt ${attempt}/${retry}] Gagal mengirim message:`, err.message)
                    if (attempt < retry) {
                        const delay = 1000 * Math.pow(2, attempt - 1) // Exponential backoff
                        await new Promise(r => setTimeout(r, delay))
                    }
                }
            }

            throw new OperationalError(
                `Gagal mengirim message setelah ${retry} attempts: ${lastError.message}`
            )
        } catch (err) {
            if (err.isValidationError || err.isOperationalError) {
                console.error(`[Button.run] ${err.name}:`, err.message)
                throw err
            }
            throw new OperationalError(`Unexpected error: ${err.message}`)
        }
    }

    async _sendMessage(
        jid,
        conn,
        quoted,
        generateWAMessageFromContent,
        prepareWAMessageMedia,
        bypass,
        options
    ) {
        // ── Mode Carousel ────────────────────────────────────────────────────
        if (this._isCarousel) {
            return await this._sendCarouselMessage(
                jid,
                conn,
                quoted,
                generateWAMessageFromContent,
                prepareWAMessageMedia,
                options
            )
        }

        // ── Mode Interactive (type 0) ────────────────────────────────────────
        if (this._type === 0) {
            return await this._sendInteractiveMessage(
                jid,
                conn,
                quoted,
                generateWAMessageFromContent,
                prepareWAMessageMedia,
                options
            )
        }

        // ── Mode buttonsMessage lama (type 1) ────────────────────────────────
        return await this._sendLegacyButtonsMessage(
            jid,
            conn,
            quoted,
            generateWAMessageFromContent,
            prepareWAMessageMedia,
            bypass,
            options
        )
    }

    async _sendCarouselMessage(
        jid,
        conn,
        quoted,
        generateWAMessageFromContent,
        prepareWAMessageMedia,
        options
    ) {
        const cards = await Promise.all(
            this._carouselCards.map(card => card._buildCard(conn, prepareWAMessageMedia))
        )

        const msg = generateWAMessageFromContent(jid, {
            interactiveMessage: {
                body: { text: this._body },
                footer: { text: this._footer },
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
                tag: 'biz',
                attrs: {},
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

    async _sendInteractiveMessage(
        jid,
        conn,
        quoted,
        generateWAMessageFromContent,
        prepareWAMessageMedia,
        options
    ) {
        // Siapkan media header
        let headerMedia = {}
        if (this._data) {
            if (this._data.jpegThumbnail) {
                headerMedia = { jpegThumbnail: this._data.jpegThumbnail }
            } else {
                headerMedia = await prepareWAMessageMedia(this._data, { upload: conn.waUploadToServer })
            }
        }

        // Siapkan audio footer
        let footerAudio = {}
        if (this._audioFooter) {
            const prepared = await prepareWAMessageMedia(this._audioFooter, { upload: conn.waUploadToServer })
            footerAudio = { audioMessage: prepared.audioMessage }
        }

        const message = {
            body: { text: this._body },
            footer: { text: this._footer, ...footerAudio },
            header: {
                title: this._title,
                subtitle: this._subtitle,
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
                    buttons: this._beton
                }
            }
        }, { quoted })

        await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id,
            additionalNodes: [{
                tag: 'biz',
                attrs: {},
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

    async _sendLegacyButtonsMessage(
        jid,
        conn,
        quoted,
        generateWAMessageFromContent,
        prepareWAMessageMedia,
        bypass,
        options
    ) {
        const msg = generateWAMessageFromContent(jid, {
            buttonsMessage: {
                ...(this._data || {}),
                [this._data ? 'caption' : 'contentText']: this._body,
                title: this._data ? null : this._title,
                footerText: this._footer,
                ...(bypass ? { headerType: 6, locationMessage: {} } : {}),
                viewOnce: true,
                contextInfo: this._contextInfo,
                buttons: [
                    ...this._betonOld,
                    ...this._beton.map(b => ({
                        buttonId: 'id',
                        buttonText: { displayText: b.name },
                        type: 1,
                        nativeFlowInfo: { name: b.name, paramsJson: b.buttonParamsJson }
                    }))
                ]
            }
        }, { quoted, ...options })

        await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id,
            additionalNodes: [{
                tag: 'biz',
                attrs: {},
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

// ─────────────────────────────────────────────────────────────────────────────
// CAROUSEL CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * [v4.0] Class helper untuk membangun kartu di dalam CarouselMessage
 */
class Carousel {
    constructor() {
        this._title    = ''
        this._subtitle = ''
        this._body     = ''
        this._footer   = ''
        this._data     = null
        this._buttons  = []

        // [v4.1] Card metadata
        this._id       = null
        this._metadata = {}
    }

    setTitle(title) {
        if (title && !Validators.isNonEmptyString(title)) {
            throw new ValidationError('Title harus berupa string')
        }
        if (title && title.length > 100) {
            throw new ValidationError('Title maksimal 100 karakter')
        }
        this._title = title
        return this
    }

    setSubtitle(subtitle) {
        if (subtitle && !Validators.isNonEmptyString(subtitle)) {
            throw new ValidationError('Subtitle harus berupa string')
        }
        if (subtitle && subtitle.length > 100) {
            throw new ValidationError('Subtitle maksimal 100 karakter')
        }
        this._subtitle = subtitle
        return this
    }

    setBody(body) {
        if (!Validators.isNonEmptyString(body)) {
            throw new ValidationError('Body tidak boleh kosong')
        }
        if (body.length > 1024) {
            throw new ValidationError('Body maksimal 1024 karakter')
        }
        this._body = body
        return this
    }

    setFooter(footer) {
        if (footer && !Validators.isNonEmptyString(footer)) {
            throw new ValidationError('Footer harus berupa string')
        }
        if (footer && footer.length > 60) {
            throw new ValidationError('Footer maksimal 60 karakter')
        }
        this._footer = footer
        return this
    }

    setImage(path, options = {}) {
        if (!path) throw new ValidationError('URL atau Buffer diperlukan untuk gambar')
        this._data = Buffer.isBuffer(path)
            ? { image: path, ...options }
            : { image: { url: Validators.isValidUrl(path) ? path : (() => {
                throw new ValidationError(`Image URL tidak valid: ${path}`)
            })() }, ...options }
        return this
    }

    setVideo(path, options = {}) {
        if (!path) throw new ValidationError('URL atau Buffer diperlukan untuk video')
        this._data = Buffer.isBuffer(path)
            ? { video: path, ...options }
            : { video: { url: Validators.isValidUrl(path) ? path : (() => {
                throw new ValidationError(`Video URL tidak valid: ${path}`)
            })() }, ...options }
        return this
    }

    addReply(display_text = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Reply display_text tidak boleh kosong')
        }
        this._buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    addUrl(display_text = '', url = '', webview_interaction = false) {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('URL button display_text tidak boleh kosong')
        }
        if (!Validators.isValidUrl(url)) {
            throw new ValidationError(`URL tidak valid: ${url}`)
        }
        this._buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction })
        })
        return this
    }

    addCopy(display_text = '', copy_code = '', id = '') {
        if (!Validators.isNonEmptyString(display_text)) {
            throw new ValidationError('Copy button display_text tidak boleh kosong')
        }
        if (!Validators.isNonEmptyString(copy_code)) {
            throw new ValidationError('Copy button copy_code tidak boleh kosong')
        }
        this._buttons.push({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text, copy_code, id })
        })
        return this
    }

    /**
     * [v4.1] Set card ID unik
     * @param {string} id - Card ID
     */
    setId(id) {
        if (!Validators.isNonEmptyString(id)) {
            throw new ValidationError('Card ID tidak boleh kosong')
        }
        this._id = id
        return this
    }

    /**
     * [v4.1] Set custom metadata
     * @param {object} metadata - Metadata object
     */
    setMetadata(metadata = {}) {
        if (typeof metadata !== 'object' || Array.isArray(metadata)) {
            throw new ValidationError('Metadata harus berupa Object')
        }
        this._metadata = metadata
        return this
    }

    /**
     * [v4.1] Validasi card sebelum build
     */
    async validate() {
        if (!Validators.isNonEmptyString(this._title)) {
            throw new ValidationError('Carousel card harus punya title')
        }
        if (!Validators.isNonEmptyString(this._body)) {
            throw new ValidationError('Carousel card harus punya body')
        }
        if (this._title.length > 100) {
            throw new ValidationError('Carousel card title maksimal 100 karakter')
        }
        if (this._body.length > 1024) {
            throw new ValidationError('Carousel card body maksimal 1024 karakter')
        }
        return true
    }

    async _buildCard(conn, prepareWAMessageMedia) {
        await this.validate()

        let headerMedia = {}
        if (this._data) {
            headerMedia = await prepareWAMessageMedia(this._data, { upload: conn.waUploadToServer })
        }

        return {
            body: { text: this._body },
            footer: { text: this._footer },
            header: {
                title: this._title,
                subtitle: this._subtitle,
                hasMediaAttachment: !!this._data,
                ...headerMedia
            },
            nativeFlowMessage: {
                buttons: this._buttons
            },
            ...(this._id ? { cardId: this._id } : {}),
            ...(Object.keys(this._metadata).length ? { metadata: this._metadata } : {})
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AIRICH CLASS
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

    /**
     * Message type constants
     */
    static MESSAGE_TYPES = {
        TEXT: 2,
        IMAGE: 1,
        INLINE_IMAGE: 3,
        TABLE: 4,
        CODE: 5,
        DYNAMIC: 6,
        MAP: 7,
        LATEX: 8,
        REELS: 9
    }

    // ── FITUR LAMA (v3.1) ─────────────────────────────────────────────────────

    addText(text) {
        if (!Validators.isNonEmptyString(text)) {
            throw new ValidationError('Text tidak boleh kosong')
        }
        if (text.length > 4096) {
            throw new ValidationError('Text maksimal 4096 karakter')
        }

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.TEXT,
            messageText: text
        })
        this._sections.push({
            view_model: {
                primitive: {
                    text,
                    __typename: 'GenAIMarkdownTextUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addCode(language, code) {
        if (!Validators.isNonEmptyString(language)) {
            throw new ValidationError('Code language tidak boleh kosong')
        }
        if (!Validators.isNonEmptyString(code)) {
            throw new ValidationError('Code tidak boleh kosong')
        }

        const meta = this.tokenizer(code, language)
        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.CODE,
            codeMetadata: {
                codeLanguage: language,
                codeBlocks: meta.codeBlock
            }
        })
        this._sections.push({
            view_model: {
                primitive: {
                    language,
                    code_blocks: meta.unified_codeBlock,
                    __typename: 'GenAICodeUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addTable(table) {
        if (!Array.isArray(table) || table.length < 2) {
            throw new ValidationError('Format tabel tidak valid (minimal 2 baris)')
        }

        const meta = this.toTableMetadata(table)
        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.TABLE,
            tableMetadata: { title: meta.title, rows: meta.rows }
        })
        this._sections.push({
            view_model: {
                primitive: {
                    rows: meta.unified_rows,
                    __typename: 'GenATableUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addSource(sources = []) {
        if (!Array.isArray(sources)) {
            throw new ValidationError('Sources harus berupa array')
        }

        const source = sources.map(([profile_url, url, text]) => {
            if (!Validators.isValidUrl(profile_url)) {
                throw new ValidationError(`Profile URL tidak valid: ${profile_url}`)
            }
            if (!Validators.isValidUrl(url)) {
                throw new ValidationError(`Source URL tidak valid: ${url}`)
            }
            return {
                source_type: 'THIRD_PARTY',
                source_display_name: text,
                source_subtitle: 'AI',
                source_url: url,
                favicon: { url: profile_url, mime_type: 'image/jpeg', width: 16, height: 16 }
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    sources: source,
                    __typename: 'GenAISearchResultPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    addReels(reelsItems = []) {
        if (!Array.isArray(reelsItems)) {
            throw new ValidationError('Reels items harus berupa array')
        }

        reelsItems.forEach((item, idx) => {
            if (!Validators.isValidUrl(item.videoUrl)) {
                throw new ValidationError(`Reels ${idx} video URL tidak valid`)
            }
            if (!Validators.isValidUrl(item.thumbnailUrl)) {
                throw new ValidationError(`Reels ${idx} thumbnail URL tidak valid`)
            }
        })

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.REELS,
            contentItemsMetadata: {
                contentType: 1,
                itemsMetadata: reelsItems.map(item => ({
                    reelItem: {
                        title: item.title,
                        profileIconUrl: item.profileIconUrl,
                        thumbnailUrl: item.thumbnailUrl,
                        videoUrl: item.videoUrl
                    }
                }))
            }
        })

        reelsItems.forEach((item, idx) => {
            this._richResponseSources.push({
                provider: 'UNKNOWN',
                thumbnailCDNURL: item.thumbnailUrl,
                sourceProviderURL: item.videoUrl,
                sourceQuery: '',
                faviconCDNURL: item.profileIconUrl,
                citationNumber: idx + 1,
                sourceTitle: item.title
            })
        })

        this._sections.push({
            view_model: {
                primitives: reelsItems.map(item => ({
                    reels_url: item.videoUrl,
                    thumbnail_url: item.thumbnailUrl,
                    creator: item.title,
                    avatar_url: item.profileIconUrl,
                    reels_title: item.reels_title,
                    likes_count: 0,
                    shares_count: 0,
                    view_count: 0,
                    reel_source: 'IG',
                    is_verified: item.is_verified,
                    __typename: 'GenAIReelPrimitive'
                })),
                __typename: 'GenAIHScrollLayoutViewModel'
            }
        })

        return this
    }

    addImage(imageUrl) {
        const imageUrls = Array.isArray(imageUrl)
            ? imageUrl
            : [imageUrl]

        imageUrls.forEach(url => {
            if (!Validators.isValidUrl(url)) {
                throw new ValidationError(`Image URL tidak valid: ${url}`)
            }
        })

        const imageUrlsObj = imageUrls.map(url => ({
            imagePreviewUrl: url,
            sourceUrl: 'https://google.com'
        }))

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.IMAGE,
            gridImageMetadata: {
                gridImageUrl: { imagePreviewUrl: imageUrls[0] },
                imageUrls: imageUrlsObj
            }
        })

        imageUrlsObj.forEach(({ imagePreviewUrl }) => {
            this._sections.push({
                view_model: {
                    primitive: {
                        media: { url: imagePreviewUrl, mime_type: 'image/jpeg' },
                        imagine_type: 3,
                        status: { status: 'READY' },
                        __typename: 'GenAIImaginePrimitive'
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            })
        })

        return this
    }

    // ── FITUR BARU (v4.0+) ────────────────────────────────────────────────────

    /**
     * [v4.0] Gambar inline dengan alignment dan tapLink
     * @param {string} imageUrl - URL gambar
     * @param {object} options - Opsi gambar
     */
    addInlineImage(imageUrl, {
        imageText = '',
        highResUrl = '',
        sourceUrl = '',
        alignment = 'center',
        tapLinkUrl = ''
    } = {}) {
        if (!Validators.isValidUrl(imageUrl)) {
            throw new ValidationError(`Inline image URL tidak valid: ${imageUrl}`)
        }
        if (imageText && imageText.length > 256) {
            throw new ValidationError('Image text maksimal 256 karakter')
        }
        if (highResUrl && !Validators.isValidUrl(highResUrl)) {
            throw new ValidationError(`High res URL tidak valid: ${highResUrl}`)
        }
        if (sourceUrl && !Validators.isValidUrl(sourceUrl)) {
            throw new ValidationError(`Source URL tidak valid: ${sourceUrl}`)
        }
        if (tapLinkUrl && !Validators.isValidUrl(tapLinkUrl)) {
            throw new ValidationError(`Tap link URL tidak valid: ${tapLinkUrl}`)
        }
        if (!['left', 'center', 'right'].includes(alignment)) {
            throw new ValidationError(`Alignment tidak valid: ${alignment}`)
        }

        const ALIGNMENT_MAP = { left: 0, right: 1, center: 2 }
        const alignVal = ALIGNMENT_MAP[alignment] ?? 2

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.INLINE_IMAGE,
            imageMetadata: {
                imageUrl: {
                    imagePreviewUrl: imageUrl,
                    ...(highResUrl ? { imageHighResUrl: highResUrl } : {}),
                    ...(sourceUrl ? { sourceUrl } : {})
                },
                ...(imageText ? { imageText } : {}),
                alignment: alignVal,
                ...(tapLinkUrl ? { tapLinkUrl } : {})
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    media: { url: imageUrl, mime_type: 'image/jpeg' },
                    caption: imageText,
                    alignment,
                    tap_url: tapLinkUrl,
                    __typename: 'GenAIInlineImageUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    /**
     * [v4.0] Gambar atau GIF dinamis
     * @param {string} url - URL gambar/GIF
     * @param {'image'|'gif'} type - Tipe konten
     * @param {number} loopCount - Jumlah perulangan
     * @param {number} version - Versi metadata
     */
    addDynamic(url, type = 'image', loopCount = 0, version = 1) {
        if (!Validators.isValidUrl(url)) {
            throw new ValidationError(`Dynamic media URL tidak valid: ${url}`)
        }
        if (!['image', 'gif'].includes(type)) {
            throw new ValidationError(`Dynamic media type tidak valid: ${type}`)
        }
        if (!Validators.isNonNegativeNumber(loopCount)) {
            throw new ValidationError(`Loop count harus non-negative: ${loopCount}`)
        }

        const TYPE_MAP = { image: 1, gif: 2 }
        const typeVal = TYPE_MAP[type] ?? 1

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.DYNAMIC,
            dynamicMetadata: {
                type: typeVal,
                version,
                url,
                loopCount
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    url,
                    media_type: type,
                    loop_count: loopCount,
                    __typename: 'GenAIDynamicMediaUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    /**
     * [v4.0] Peta interaktif dengan marker
     * @param {object} center - Koordinat pusat
     * @param {Array} annotations - Array marker
     * @param {boolean} showInfoList - Tampilkan info list
     */
    addMap(center = {}, annotations = [], showInfoList = true) {
        const {
            latitude = 0,
            longitude = 0,
            latDelta = 0.05,
            lngDelta = 0.05
        } = center

        if (!Validators.isValidLatitude(latitude)) {
            throw new ValidationError(`Latitude tidak valid: ${latitude}`)
        }
        if (!Validators.isValidLongitude(longitude)) {
            throw new ValidationError(`Longitude tidak valid: ${longitude}`)
        }

        annotations.forEach((a, idx) => {
            const lat = a.lat ?? a.latitude
            const lng = a.lng ?? a.longitude
            if (!Validators.isValidLatitude(lat)) {
                throw new ValidationError(`Annotation ${idx} latitude tidak valid: ${lat}`)
            }
            if (!Validators.isValidLongitude(lng)) {
                throw new ValidationError(`Annotation ${idx} longitude tidak valid: ${lng}`)
            }
        })

        const annotationList = annotations.map((a, idx) => ({
            annotationNumber: idx + 1,
            latitude: a.lat ?? a.latitude ?? 0,
            longitude: a.lng ?? a.longitude ?? 0,
            title: a.title ?? '',
            body: a.body ?? ''
        }))

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.MAP,
            mapMetadata: {
                centerLatitude: latitude,
                centerLongitude: longitude,
                latitudeDelta: latDelta,
                longitudeDelta: lngDelta,
                annotations: annotationList,
                showInfoList
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    center_lat: latitude,
                    center_lng: longitude,
                    lat_delta: latDelta,
                    lng_delta: lngDelta,
                    annotations: annotationList.map(a => ({
                        number: a.annotationNumber,
                        lat: a.latitude,
                        lng: a.longitude,
                        title: a.title,
                        body: a.body
                    })),
                    show_info: showInfoList,
                    __typename: 'GenAIMapUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    /**
     * [v4.0] Rumus LaTeX
     * @param {string} introText - Teks pengantar
     * @param {Array} expressions - Array ekspresi LaTeX
     */
    addLatex(introText = '', expressions = []) {
        if (!Array.isArray(expressions)) {
            throw new ValidationError('Expressions harus berupa array')
        }

        expressions.forEach((e, idx) => {
            if (!Validators.isValidUrl(e.url)) {
                throw new ValidationError(`Latex expression ${idx} URL tidak valid: ${e.url}`)
            }
            if (!Validators.isNonEmptyString(e.latex)) {
                throw new ValidationError(`Latex expression ${idx} tidak boleh kosong`)
            }
        })

        const exprList = expressions.map(e => ({
            latexExpression: e.latex ?? '',
            url: e.url ?? '',
            width: e.width ?? 200,
            height: e.height ?? 50,
            fontHeight: e.fontHeight ?? 14,
            imageTopPadding: e.topPadding ?? 4,
            imageLeadingPadding: e.leadingPadding ?? 4,
            imageBottomPadding: e.bottomPadding ?? 4,
            imageTrailingPadding: e.trailingPadding ?? 4
        }))

        this._submessages.push({
            messageType: AIRich.MESSAGE_TYPES.LATEX,
            latexMetadata: {
                text: introText,
                expressions: exprList
            }
        })

        this._sections.push({
            view_model: {
                primitive: {
                    intro_text: introText,
                    expressions: exprList.map(e => ({
                        latex: e.latexExpression,
                        url: e.url,
                        width: e.width,
                        height: e.height
                    })),
                    __typename: 'GenAILatexUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })

        return this
    }

    // ── BUILD & RUN ───────────────────────────────────────────────────────────

    build({ forwarded = true, includesUnifiedResponse = true } = {}) {
        const contextInfo = forwarded
            ? {
                forwardingScore: 1,
                isForwarded: true,
                forwardedAiBotMessageInfo: { botJid: '0@bot' },
                forwardOrigin: 4
            }
            : {}

        return {
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    pluginMetadata: {},
                    richResponseSourcesMetadata: { sources: this._richResponseSources }
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: this._submessages,
                        unifiedResponse: {
                            data: includesUnifiedResponse
                                ? Buffer.from(JSON.stringify({
                                    response_id: crypto.randomUUID(),
                                    sections: this._sections
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
        try {
            if (!Validators.isValidJid(chat)) {
                throw new ValidationError(`Chat JID tidak valid: ${chat}`)
            }
            if (!conn) {
                throw new ValidationError('Connection object tidak ditemukan')
            }

            const payload = this.build({ forwarded, includesUnifiedResponse })
            return await conn.relayMessage(chat, payload, { ...options })
        } catch (err) {
            if (err.isValidationError) {
                console.error(`[AIRich.run] ${err.name}:`, err.message)
                throw err
            }
            throw new OperationalError(`Unexpected error: ${err.message}`)
        }
    }

    // ── HELPER METHODS ────────────────────────────────────────────────────────

    tokenizer(code, lang = 'javascript') {
        const keywordsMap = {
            javascript: new Set([
                'break', 'case', 'catch', 'continue', 'debugger', 'delete', 'do', 'else', 'finally',
                'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw',
                'try', 'typeof', 'var', 'void', 'while', 'with', 'true', 'false', 'null', 'undefined',
                'class', 'const', 'let', 'super', 'extends', 'export', 'import', 'yield', 'static',
                'constructor', 'async', 'await', 'get', 'set'
            ])
        }

        const TYPE_MAP = { 0: 'DEFAULT', 1: 'KEYWORD', 2: 'METHOD', 3: 'STR', 4: 'NUMBER', 5: 'COMMENT' }
        const keywords = keywordsMap[lang] || new Set()
        const tokens = []
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
                let s = i
                while (i < code.length && /\s/.test(code[i])) i++
                push(code.slice(s, i), 0)
                continue
            }

            if (c === '/' && code[i + 1] === '/') {
                let s = i
                i += 2
                while (i < code.length && code[i] !== '\n') i++
                push(code.slice(s, i), 5)
                continue
            }

            if (c === '"' || c === "'" || c === '`') {
                let s = i
                const q = c
                i++
                while (i < code.length) {
                    if (code[i] === '\\' && i + 1 < code.length) i += 2
                    else if (code[i] === q) { i++; break }
                    else i++
                }
                push(code.slice(s, i), 3)
                continue
            }

            if (/[0-9]/.test(c)) {
                let s = i
                while (i < code.length && /[0-9.]/.test(code[i])) i++
                push(code.slice(s, i), 4)
                continue
            }

            if (/[a-zA-Z_$]/.test(c)) {
                let s = i
                while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++
                const word = code.slice(s, i)
                let type = 0

                if (keywords.has(word)) {
                    type = 1
                } else {
                    let j = i
                    while (j < code.length && /\s/.test(code[j])) j++
                    if (code[j] === '(') type = 2
                }
                push(word, type)
                continue
            }

            push(c, 0)
            i++
        }

        return {
            codeBlock: tokens,
            unified_codeBlock: tokens.map(t => ({ content: t.codeContent, type: TYPE_MAP[t.highlightType] }))
        }
    }

    toTableMetadata(arr) {
        if (!Array.isArray(arr) || arr.length < 2) {
            throw new ValidationError('Format tabel ngawur (minimal 2 baris)')
        }

        const [header, ...rows] = arr
        const maxLen = Math.max(header.length, ...rows.map(r => r.length))
        const normalize = r => [...r, ...Array(maxLen - r.length).fill('')]

        const unified_rows = [
            { is_header: true, cells: normalize(header) },
            ...rows.map(r => ({ is_header: false, cells: normalize(r) }))
        ]

        return {
            title: '',
            rows: unified_rows.map(r => ({
                items: r.cells,
                ...(r.is_header ? { isHeading: true } : {})
            })),
            unified_rows
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    // Classes
    Button,
    Carousel,
    AIRich,

    // Error Classes
    ValidationError,
    OperationalError,

    // Validators
    Validators,

    // Helper factories
    createButton: () => new Button(),
    createCarousel: () => new Carousel(),
    createAIRich: () => new AIRich(),

    // Constants
    CAROUSEL_TYPES: {
        HSCROLL: 'hscroll',
        ALBUM: 'album'
    },

    MESSAGE_TYPES: AIRich.MESSAGE_TYPES
}
