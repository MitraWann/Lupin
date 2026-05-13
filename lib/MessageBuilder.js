/**
 * MessageBuilder v5.0
 * Flora WhatsApp Bot — Baileys Whiskeysockets
 *
 * Dibangun dari nol berdasarkan proto aktual WAProto.
 * Author: Mitra
 *
 * Classes:
 *  - Button          → InteractiveMessage (native flow, carousel, shop, collection)
 *  - ButtonLegacy    → ButtonsMessage lama + ListMessage
 *  - Carousel        → Card builder untuk CarouselMessage
 *  - AIRich          → Rich AI response (9 submessage types)
 *  - ProgressStep    → Agentic planning step
 */

'use strict'

const crypto = require('crypto')

// ── Baileys Loader ────────────────────────────────────────────────────────────

let mitraBAILEYS = null
const mitraBAILEYS_READY = (async () => {
    const { loadBaileys } = await import('../baileys-loader.mjs')
    mitraBAILEYS = await loadBaileys()
})().catch(err => console.error('[MessageBuilder] Gagal load Baileys:', err))

async function mitraGetBaileys() {
    if (!mitraBAILEYS) await mitraBAILEYS_READY
    return mitraBAILEYS
}

// ── Raw Message Cache (LRU cap 200) ───────────────────────────────────────────

function mitraCacheMsg(mitraMsgId, mitraMsgObj) {
    global.mitraRawMessages = global.mitraRawMessages || new Map()
    global.mitraRawMessages.set(mitraMsgId, mitraMsgObj)
    if (global.mitraRawMessages.size > 200)
        global.mitraRawMessages.delete(global.mitraRawMessages.keys().next().value)
}

// ── additionalNodes helper ─────────────────────────────────────────────────────

const mitraNativeFlowNodes = [{
    tag: 'biz', attrs: {},
    content: [{
        tag: 'interactive',
        attrs: { type: 'native_flow', v: '1' },
        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
    }]
}]

async function mitraRelay(mitraConn, mitraMsg, mitraOpts = {}) {
    await mitraConn.relayMessage(mitraMsg.key.remoteJid, mitraMsg.message, {
        messageId: mitraMsg.key.id,
        additionalNodes: mitraNativeFlowNodes,
        ...mitraOpts
    })
    mitraCacheMsg(mitraMsg.key.id, mitraMsg)
    return mitraMsg
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: Button
// InteractiveMessage — native flow, carousel, shop, collection
// ─────────────────────────────────────────────────────────────────────────────

class Button {
    constructor() {
        this._mitraTitle        = ''
        this._mitraSubtitle     = ''
        this._mitraBody         = ''
        this._mitraFooter       = ''
        this._mitraButtons      = []
        this._mitraParams       = {}
        this._mitraContextInfo  = {}
        this._mitraMedia        = null
        this._mitraMode         = 'native'   // 'native' | 'carousel' | 'shop' | 'collection'
        this._mitraCards        = []
        this._mitraCarouselType = 1          // 1=HSCROLL, 2=ALBUM
        this._mitraShop         = null
        this._mitraCollection   = null

        // cursor untuk single_select
        this._mitraSelIdx       = -1
        this._mitraSecIdx       = -1
    }

    // ── Header Text ───────────────────────────────────────────────────────────

    setTitle(v)    { this._mitraTitle    = v; return this }
    setSubtitle(v) { this._mitraSubtitle = v; return this }
    setBody(v)     { this._mitraBody     = v; return this }
    setFooter(v)   { this._mitraFooter   = v; return this }

    setContextInfo(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) throw new TypeError('contextInfo harus object')
        this._mitraContextInfo = obj
        return this
    }

    setParams(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) throw new TypeError('params harus object')
        this._mitraParams = obj
        return this
    }

    // ── Media Header ──────────────────────────────────────────────────────────

    setImage(path, opts = {}) {
        this._mitraMedia = Buffer.isBuffer(path)
            ? { image: path, ...opts }
            : { image: { url: path }, ...opts }
        return this
    }

    setVideo(path, opts = {}) {
        this._mitraMedia = Buffer.isBuffer(path)
            ? { video: path, ...opts }
            : { video: { url: path }, ...opts }
        return this
    }

    setDocument(path, opts = {}) {
        this._mitraMedia = Buffer.isBuffer(path)
            ? { document: path, ...opts }
            : { document: { url: path }, ...opts }
        return this
    }

    setMedia(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) throw new TypeError('media harus object')
        this._mitraMedia = obj
        return this
    }

    /**
     * Thumbnail langsung dari Buffer (tanpa upload).
     * @param {Buffer} buf
     */
    setThumbnail(buf) {
        if (!Buffer.isBuffer(buf)) throw new TypeError('setThumbnail butuh Buffer')
        this._mitraMedia = { jpegThumbnail: buf }
        return this
    }

    // ── Tombol Native Flow ────────────────────────────────────────────────────

    /** Quick reply button */
    addReply(display_text = '', id = '') {
        this._mitraButtons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    /** URL button */
    addUrl(display_text = '', url = '', webview_interaction = false) {
        this._mitraButtons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction })
        })
        return this
    }

    /** Copy code button */
    addCopy(display_text = '', copy_code = '', id = '') {
        this._mitraButtons.push({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text, copy_code, id })
        })
        return this
    }

    /** Call button */
    addCall(display_text = '', id = '') {
        this._mitraButtons.push({
            name: 'cta_call',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    /** Send location button */
    addLocation() {
        this._mitraButtons.push({ name: 'send_location', buttonParamsJson: '' })
        return this
    }

    /** Address message button */
    addAddress(display_text = '', id = '') {
        this._mitraButtons.push({
            name: 'address_message',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    /** Reminder button */
    addReminder(display_text = '', id = '') {
        this._mitraButtons.push({
            name: 'cta_reminder',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    /** Cancel reminder button */
    addCancelReminder(display_text = '', id = '') {
        this._mitraButtons.push({
            name: 'cta_cancel_reminder',
            buttonParamsJson: JSON.stringify({ display_text, id })
        })
        return this
    }

    // ── Single Select (List) ──────────────────────────────────────────────────

    /**
     * Buat tombol single_select baru.
     * @param {string} title - Label tombol dropdown
     */
    addSelection(title = '') {
        this._mitraButtons.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({ title, sections: [] })
        })
        this._mitraSelIdx = this._mitraButtons.length - 1
        this._mitraSecIdx = -1
        return this
    }

    /**
     * Tambah section ke selection aktif.
     * @param {string} title
     * @param {string} highlight_label
     */
    addSection(title = '', highlight_label = '') {
        if (this._mitraSelIdx === -1) throw new Error('Buat selection dulu via addSelection()')
        const mitraP = JSON.parse(this._mitraButtons[this._mitraSelIdx].buttonParamsJson)
        mitraP.sections.push({ title, highlight_label, rows: [] })
        this._mitraSecIdx = mitraP.sections.length - 1
        this._mitraButtons[this._mitraSelIdx].buttonParamsJson = JSON.stringify(mitraP)
        return this
    }

    /**
     * Tambah row ke section aktif.
     * @param {string} header
     * @param {string} title
     * @param {string} description
     * @param {string} id
     */
    addRow(header = '', title = '', description = '', id = '') {
        if (this._mitraSelIdx === -1 || this._mitraSecIdx === -1)
            throw new Error('Buat selection dan section dulu')
        const mitraP = JSON.parse(this._mitraButtons[this._mitraSelIdx].buttonParamsJson)
        mitraP.sections[this._mitraSecIdx].rows.push({ header, title, description, id })
        this._mitraButtons[this._mitraSelIdx].buttonParamsJson = JSON.stringify(mitraP)
        return this
    }

    // ── Carousel ──────────────────────────────────────────────────────────────

    /**
     * Tambah card ke carousel.
     * @param {Carousel} mitraCard
     * @param {'hscroll'|'album'} type
     */
    addCarousel(mitraCard, type = 'hscroll') {
        if (!(mitraCard instanceof Carousel))
            throw new TypeError('addCarousel butuh instance Carousel')
        this._mitraMode         = 'carousel'
        this._mitraCarouselType = type === 'album' ? 2 : 1
        this._mitraCards.push(mitraCard)
        return this
    }

    // ── Shop & Collection ─────────────────────────────────────────────────────

    /**
     * Mode Shop Message.
     * @param {string} id
     * @param {'FB'|'IG'|'WA'} surface
     */
    setShop(id, surface = 'WA') {
        const mitraSurfaceMap = { FB: 1, IG: 2, WA: 3 }
        this._mitraMode = 'shop'
        this._mitraShop = { id, surface: mitraSurfaceMap[surface] ?? 3 }
        return this
    }

    /**
     * Mode Collection Message.
     * @param {string} bizJid
     * @param {string} id
     * @param {number} messageVersion
     */
    setCollection(bizJid, id, messageVersion = 1) {
        this._mitraMode       = 'collection'
        this._mitraCollection = { bizJid, id, messageVersion }
        return this
    }

    // ── Build & Run ───────────────────────────────────────────────────────────

    async run(mitraJid, mitraConn, mitraQuoted = '', mitraOpts = {}) {
        const { generateWAMessageFromContent, prepareWAMessageMedia } = await mitraGetBaileys()

        // ── Carousel ──────────────────────────────────────────────────────────
        if (this._mitraMode === 'carousel') {
            const mitraBuiltCards = await Promise.all(
                this._mitraCards.map(c => c._buildCard(mitraConn, prepareWAMessageMedia))
            )
            const mitraMsg = generateWAMessageFromContent(mitraJid, {
                interactiveMessage: {
                    body:        { text: this._mitraBody },
                    footer:      { text: this._mitraFooter },
                    contextInfo: this._mitraContextInfo,
                    carouselMessage: {
                        cards:            mitraBuiltCards,
                        messageVersion:   1,
                        carouselCardType: this._mitraCarouselType
                    }
                }
            }, { quoted: mitraQuoted })
            return mitraRelay(mitraConn, mitraMsg, mitraOpts)
        }

        // ── Shop ──────────────────────────────────────────────────────────────
        if (this._mitraMode === 'shop') {
            const mitraMsg = generateWAMessageFromContent(mitraJid, {
                interactiveMessage: {
                    body:        { text: this._mitraBody },
                    footer:      { text: this._mitraFooter },
                    header:      { title: this._mitraTitle, subtitle: this._mitraSubtitle, hasMediaAttachment: false },
                    contextInfo: this._mitraContextInfo,
                    shopMessage: this._mitraShop
                }
            }, { quoted: mitraQuoted })
            return mitraRelay(mitraConn, mitraMsg, mitraOpts)
        }

        // ── Collection ────────────────────────────────────────────────────────
        if (this._mitraMode === 'collection') {
            const mitraMsg = generateWAMessageFromContent(mitraJid, {
                interactiveMessage: {
                    body:        { text: this._mitraBody },
                    footer:      { text: this._mitraFooter },
                    header:      { title: this._mitraTitle, subtitle: this._mitraSubtitle, hasMediaAttachment: false },
                    contextInfo: this._mitraContextInfo,
                    collectionMessage: this._mitraCollection
                }
            }, { quoted: mitraQuoted })
            return mitraRelay(mitraConn, mitraMsg, mitraOpts)
        }

        // ── Native Flow (default) ─────────────────────────────────────────────
        let mitraHeaderMedia = {}
        if (this._mitraMedia) {
            if (this._mitraMedia.jpegThumbnail) {
                mitraHeaderMedia = { jpegThumbnail: this._mitraMedia.jpegThumbnail }
            } else {
                mitraHeaderMedia = await prepareWAMessageMedia(this._mitraMedia, {
                    upload: mitraConn.waUploadToServer
                })
            }
        }

        const mitraMsg = generateWAMessageFromContent(mitraJid, {
            interactiveMessage: {
                body:   { text: this._mitraBody },
                footer: { text: this._mitraFooter },
                header: {
                    title:              this._mitraTitle,
                    subtitle:           this._mitraSubtitle,
                    hasMediaAttachment: !!this._mitraMedia,
                    ...mitraHeaderMedia
                },
                contextInfo: this._mitraContextInfo,
                nativeFlowMessage: {
                    messageParamsJson: JSON.stringify(this._mitraParams),
                    buttons:           this._mitraButtons
                }
            }
        }, { quoted: mitraQuoted })

        return mitraRelay(mitraConn, mitraMsg, mitraOpts)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: ButtonLegacy
// ButtonsMessage (lama) + ListMessage
// ─────────────────────────────────────────────────────────────────────────────

class ButtonLegacy {
    constructor() {
        this._mitraBody        = ''
        this._mitraFooter      = ''
        this._mitraTitle       = ''
        this._mitraButtons     = []
        this._mitraMedia       = null
        this._mitraHeaderType  = 1   // EMPTY
        this._mitraContextInfo = {}
        this._mitraBypass      = false
        this._mitraMode        = 'buttons'
    }

    setBody(v)    { this._mitraBody   = v; return this }
    setFooter(v)  { this._mitraFooter = v; return this }
    setTitle(v)   { this._mitraTitle  = v; return this }
    setBypass(v)  { this._mitraBypass = !!v; return this }

    setContextInfo(obj) {
        if (typeof obj !== 'object' || Array.isArray(obj)) throw new TypeError('contextInfo harus object')
        this._mitraContextInfo = obj
        return this
    }

    setImage(path, opts = {}) {
        this._mitraMedia      = Buffer.isBuffer(path) ? { image: path, ...opts } : { image: { url: path }, ...opts }
        this._mitraHeaderType = 4
        return this
    }

    setVideo(path, opts = {}) {
        this._mitraMedia      = Buffer.isBuffer(path) ? { video: path, ...opts } : { video: { url: path }, ...opts }
        this._mitraHeaderType = 5
        return this
    }

    setDocument(path, opts = {}) {
        this._mitraMedia      = Buffer.isBuffer(path) ? { document: path, ...opts } : { document: { url: path }, ...opts }
        this._mitraHeaderType = 3
        return this
    }

    addReply(displayText = '', buttonId = '') {
        this._mitraButtons.push({
            buttonId,
            buttonText: { displayText },
            type: 1
        })
        return this
    }

    // ── Run ───────────────────────────────────────────────────────────────────

    async run(mitraJid, mitraConn, mitraQuoted = '', mitraOpts = {}) {
        const { generateWAMessageFromContent, prepareWAMessageMedia } = await mitraGetBaileys()

        // ── ButtonsMessage ────────────────────────────────────────────────────
        let mitraMediaPayload = {}
        if (this._mitraMedia) {
            mitraMediaPayload = await prepareWAMessageMedia(this._mitraMedia, {
                upload: mitraConn.waUploadToServer
            })
        }

        const mitraMsg = generateWAMessageFromContent(mitraJid, {
            buttonsMessage: {
                ...mitraMediaPayload,
                [this._mitraMedia ? 'caption' : 'contentText']: this._mitraBody,
                title:       this._mitraMedia ? undefined : this._mitraTitle,
                footerText:  this._mitraFooter,
                headerType:  this._mitraBypass ? 6 : this._mitraHeaderType,
                ...(this._mitraBypass ? { locationMessage: {} } : {}),
                viewOnce:    true,
                contextInfo: this._mitraContextInfo,
                buttons:     this._mitraButtons
            }
        }, { quoted: mitraQuoted })

        await mitraConn.relayMessage(mitraMsg.key.remoteJid, mitraMsg.message, {
            messageId: mitraMsg.key.id,
            additionalNodes: mitraNativeFlowNodes,
            ...mitraOpts
        })
        mitraCacheMsg(mitraMsg.key.id, mitraMsg)
        return mitraMsg
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: Carousel
// Card builder untuk Button.addCarousel()
// ─────────────────────────────────────────────────────────────────────────────

class Carousel {
    constructor() {
        this._mitraTitle    = ''
        this._mitraSubtitle = ''
        this._mitraBody     = ''
        this._mitraFooter   = ''
        this._mitraMedia    = null
        this._mitraButtons  = []
    }

    setTitle(v)    { this._mitraTitle    = v; return this }
    setSubtitle(v) { this._mitraSubtitle = v; return this }
    setBody(v)     { this._mitraBody     = v; return this }
    setFooter(v)   { this._mitraFooter   = v; return this }

    setImage(path, opts = {}) {
        this._mitraMedia = Buffer.isBuffer(path)
            ? { image: path, ...opts }
            : { image: { url: path }, ...opts }
        return this
    }

    setVideo(path, opts = {}) {
        this._mitraMedia = Buffer.isBuffer(path)
            ? { video: path, ...opts }
            : { video: { url: path }, ...opts }
        return this
    }

    addReply(display_text = '', id = '') {
        this._mitraButtons.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text, id }) })
        return this
    }

    addUrl(display_text = '', url = '', webview_interaction = false) {
        this._mitraButtons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction }) })
        return this
    }

    addCopy(display_text = '', copy_code = '', id = '') {
        this._mitraButtons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text, copy_code, id }) })
        return this
    }

    /** @internal */
    async _buildCard(mitraConn, prepareWAMessageMedia) {
        let mitraHeaderMedia = {}
        if (this._mitraMedia) {
            mitraHeaderMedia = await prepareWAMessageMedia(this._mitraMedia, {
                upload: mitraConn.waUploadToServer
            })
        }
        return {
            body:   { text: this._mitraBody },
            footer: { text: this._mitraFooter },
            header: {
                title:              this._mitraTitle,
                subtitle:           this._mitraSubtitle,
                hasMediaAttachment: !!this._mitraMedia,
                ...mitraHeaderMedia
            },
            nativeFlowMessage: { buttons: this._mitraButtons }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: ProgressStep
// Agentic planning step untuk BotProgressIndicatorMetadata
// ─────────────────────────────────────────────────────────────────────────────

class ProgressStep {
    constructor() {
        this._mitraSources  = []
        this._mitraSections = []
    }

    /**
     * Tambah search source ke step ini.
     * @param {number} provider - 0=UNKNOWN, 1=OTHER, 2=GOOGLE, 3=BING
     * @param {string} title
     */
    addSource(provider = 0, title = '') {
        this._mitraSources.push({ provider, title })
        return this
    }

    /** @internal */
    build() {
        return {
            sourcesMetadata: this._mitraSources,
            sections:        this._mitraSections
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: AIRich
// Rich AI response — 9 submessage types + progress indicator
// ─────────────────────────────────────────────────────────────────────────────

class AIRich {
    constructor() {
        this._mitraSubmessages  = []
        this._mitraSections     = []
        this._mitraSources      = []
        this._mitraSteps        = []
    }

    // ── type 2: Text ──────────────────────────────────────────────────────────

    addText(text) {
        this._mitraSubmessages.push({ messageType: 2, messageText: text })
        this._mitraSections.push({
            view_model: {
                primitive: { text, __typename: 'GenAIMarkdownTextUXPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    // ── type 5: Code ──────────────────────────────────────────────────────────

    addCode(language, code) {
        const mitraMeta = this._tokenize(code, language)
        this._mitraSubmessages.push({
            messageType: 5,
            codeMetadata: { codeLanguage: language, codeBlocks: mitraMeta.codeBlock }
        })
        this._mitraSections.push({
            view_model: {
                primitive: {
                    language,
                    code_blocks: mitraMeta.unified_codeBlock,
                    __typename: 'GenAICodeUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    // ── type 4: Table ─────────────────────────────────────────────────────────

    /**
     * @param {Array[]} table - Array of arrays. Baris pertama = header.
     * @param {string}  title
     */
    addTable(table, title = '') {
        const mitraMeta = this._buildTable(table, title)
        this._mitraSubmessages.push({
            messageType: 4,
            tableMetadata: { title: mitraMeta.title, rows: mitraMeta.rows }
        })
        this._mitraSections.push({
            view_model: {
                primitive: { rows: mitraMeta.unified_rows, __typename: 'GenATableUXPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    // ── type 1: Grid Image ────────────────────────────────────────────────────

    /**
     * @param {string|string[]} imageUrl - Satu URL atau array URL gambar
     */
    addImage(imageUrl) {
        const mitraUrls = Array.isArray(imageUrl)
            ? imageUrl.map(u => ({ imagePreviewUrl: u, sourceUrl: 'https://google.com' }))
            : [{ imagePreviewUrl: imageUrl, sourceUrl: 'https://google.com' }]

        this._mitraSubmessages.push({
            messageType: 1,
            gridImageMetadata: {
                gridImageUrl: { imagePreviewUrl: Array.isArray(imageUrl) ? imageUrl[0] : imageUrl },
                imageUrls: mitraUrls
            }
        })

        mitraUrls.forEach(({ imagePreviewUrl }) => {
            this._mitraSections.push({
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

    // ── type 3: Inline Image ──────────────────────────────────────────────────

    /**
     * @param {string} imageUrl
     * @param {object} opts
     * @param {string} opts.imageText
     * @param {string} opts.highResUrl
     * @param {string} opts.sourceUrl
     * @param {'left'|'center'|'right'} opts.alignment
     * @param {string} opts.tapLinkUrl
     */
    addInlineImage(imageUrl, {
        imageText  = '',
        highResUrl = '',
        sourceUrl  = '',
        alignment  = 'center',
        tapLinkUrl = ''
    } = {}) {
        const mitraAlignMap = { left: 0, right: 1, center: 2 }
        const mitraAlign    = mitraAlignMap[alignment] ?? 2

        this._mitraSubmessages.push({
            messageType: 3,
            imageMetadata: {
                imageUrl: {
                    imagePreviewUrl: imageUrl,
                    ...(highResUrl ? { imageHighResUrl: highResUrl } : {}),
                    ...(sourceUrl  ? { sourceUrl }                  : {})
                },
                ...(imageText  ? { imageText }  : {}),
                alignment:  mitraAlign,
                ...(tapLinkUrl ? { tapLinkUrl } : {})
            }
        })

        this._mitraSections.push({
            view_model: {
                primitive: {
                    media:      { url: imageUrl, mime_type: 'image/jpeg' },
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

    // ── type 6: Dynamic / GIF ─────────────────────────────────────────────────

    /**
     * @param {string} url
     * @param {'image'|'gif'} type
     * @param {number} loopCount
     * @param {number} version
     */
    addDynamic(url, type = 'image', loopCount = 0, version = 1) {
        const mitraTypeMap = { image: 1, gif: 2 }
        const mitraType    = mitraTypeMap[type] ?? 1

        this._mitraSubmessages.push({
            messageType: 6,
            dynamicMetadata: { type: mitraType, version, url, loopCount }
        })

        this._mitraSections.push({
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

    // ── type 7: Map ───────────────────────────────────────────────────────────

    /**
     * @param {{ latitude, longitude, latDelta?, lngDelta? }} center
     * @param {{ lat, lng, title, body }[]} annotations
     * @param {boolean} showInfoList
     */
    addMap(center = {}, annotations = [], showInfoList = true) {
        const {
            latitude  = 0,
            longitude = 0,
            latDelta  = 0.05,
            lngDelta  = 0.05
        } = center

        const mitraAnnotations = annotations.map((a, i) => ({
            annotationNumber: i + 1,
            latitude:         a.lat  ?? a.latitude  ?? 0,
            longitude:        a.lng  ?? a.longitude ?? 0,
            title:            a.title ?? '',
            body:             a.body  ?? ''
        }))

        this._mitraSubmessages.push({
            messageType: 7,
            mapMetadata: {
                centerLatitude:  latitude,
                centerLongitude: longitude,
                latitudeDelta:   latDelta,
                longitudeDelta:  lngDelta,
                annotations:     mitraAnnotations,
                showInfoList
            }
        })

        this._mitraSections.push({
            view_model: {
                primitive: {
                    center_lat:   latitude,
                    center_lng:   longitude,
                    lat_delta:    latDelta,
                    lng_delta:    lngDelta,
                    annotations:  mitraAnnotations.map(a => ({
                        number: a.annotationNumber,
                        lat:    a.latitude,
                        lng:    a.longitude,
                        title:  a.title,
                        body:   a.body
                    })),
                    show_info:    showInfoList,
                    __typename:   'GenAIMapUXPrimitive'
                },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    // ── type 8: LaTeX ─────────────────────────────────────────────────────────

    /**
     * @param {string} introText
     * @param {{ latex, url, width?, height?, fontHeight?, topPadding?, leadingPadding?, bottomPadding?, trailingPadding? }[]} expressions
     */
    addLatex(introText = '', expressions = []) {
        const mitraExprs = expressions.map(e => ({
            latexExpression:      e.latex        ?? '',
            url:                  e.url          ?? '',
            width:                e.width        ?? 200,
            height:               e.height       ?? 50,
            fontHeight:           e.fontHeight   ?? 14,
            imageTopPadding:      e.topPadding   ?? 4,
            imageLeadingPadding:  e.leadingPadding  ?? 4,
            imageBottomPadding:   e.bottomPadding   ?? 4,
            imageTrailingPadding: e.trailingPadding ?? 4
        }))

        this._mitraSubmessages.push({
            messageType: 8,
            latexMetadata: { text: introText, expressions: mitraExprs }
        })

        this._mitraSections.push({
            view_model: {
                primitive: {
                    intro_text:  introText,
                    expressions: mitraExprs.map(e => ({
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

    // ── type 9: Reels / Content Items ─────────────────────────────────────────

    /**
     * @param {{ title, profileIconUrl, thumbnailUrl, videoUrl }[]} items
     */
    addReels(items = []) {
        this._mitraSubmessages.push({
            messageType: 9,
            contentItemsMetadata: {
                contentType:   1,
                itemsMetadata: items.map(item => ({
                    reelItem: {
                        title:          item.title,
                        profileIconUrl: item.profileIconUrl,
                        thumbnailUrl:   item.thumbnailUrl,
                        videoUrl:       item.videoUrl
                    }
                }))
            }
        })

        items.forEach((item, idx) => {
            this._mitraSources.push({
                provider:          'UNKNOWN',
                thumbnailCDNURL:   item.thumbnailUrl,
                sourceProviderURL: item.videoUrl,
                sourceQuery:       '',
                faviconCDNURL:     item.profileIconUrl,
                citationNumber:    idx + 1,
                sourceTitle:       item.title
            })
        })

        this._mitraSections.push({
            view_model: {
                primitives: items.map(item => ({
                    reels_url:     item.videoUrl,
                    thumbnail_url: item.thumbnailUrl,
                    creator:       item.title,
                    avatar_url:    item.profileIconUrl,
                    reel_source:   'IG',
                    is_verified:   item.is_verified ?? false,
                    __typename:    'GenAIReelPrimitive'
                })),
                __typename: 'GenAIHScrollLayoutViewModel'
            }
        })
        return this
    }

    // ── Sources ───────────────────────────────────────────────────────────────

    /**
     * Tambah source card di bawah respons.
     * @param {[string, string, string][]} sources - Array of [favicon_url, url, display_name]
     */
    addSource(sources = []) {
        const mitraSrc = sources.map(([favicon_url, url, text]) => ({
            source_type:         'THIRD_PARTY',
            source_display_name: text,
            source_subtitle:     'AI',
            source_url:          url,
            favicon: { url: favicon_url, mime_type: 'image/jpeg', width: 16, height: 16 }
        }))
        this._mitraSections.push({
            view_model: {
                primitive: { sources: mitraSrc, __typename: 'GenAISearchResultPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        })
        return this
    }

    // ── Progress Indicator (Agentic Planning) ─────────────────────────────────

    /**
     * Tambah planning step.
     * @param {ProgressStep} mitraStep
     */
    addStep(mitraStep) {
        if (!(mitraStep instanceof ProgressStep))
            throw new TypeError('addStep butuh instance ProgressStep')
        this._mitraSteps.push(mitraStep.build())
        return this
    }

    // ── Build & Run ───────────────────────────────────────────────────────────

    build({ forwarded = true, includesUnifiedResponse = true } = {}) {
        const mitraContextInfo = forwarded ? {
            forwardingScore: 1,
            isForwarded:     true,
            forwardedAiBotMessageInfo: { botJid: '0@bot' },
            forwardOrigin:   4
        } : {}

        const mitraPayload = {
            messageContextInfo: {
                deviceListMetadata:        {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                    pluginMetadata:              {},
                    richResponseSourcesMetadata: { sources: this._mitraSources },
                    ...(this._mitraSteps.length ? {
                        progressIndicatorMetadata: { stepsMetadata: this._mitraSteps }
                    } : {})
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: this._mitraSubmessages,
                        unifiedResponse: {
                            data: includesUnifiedResponse
                                ? Buffer.from(JSON.stringify({
                                    response_id: crypto.randomUUID(),
                                    sections:    this._mitraSections
                                  })).toString('base64')
                                : ''
                        },
                        contextInfo: mitraContextInfo
                    }
                }
            }
        }

        return mitraPayload
    }

    async run(mitraChat, mitraConn, {
        forwarded = true,
        includesUnifiedResponse = true,
        ...mitraOpts
    } = {}) {
        const mitraPayload = this.build({ forwarded, includesUnifiedResponse })
        return await mitraConn.relayMessage(mitraChat, mitraPayload, mitraOpts)
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    _tokenize(code, lang = 'javascript') {
        const mitraKwMap = {
            javascript: new Set([
                'break','case','catch','continue','debugger','delete','do','else','finally',
                'for','function','if','in','instanceof','new','return','switch','this','throw',
                'try','typeof','var','void','while','with','true','false','null','undefined',
                'class','const','let','super','extends','export','import','yield','static',
                'constructor','async','await','get','set'
            ])
        }
        const mitraTypeMap = { 0: 'DEFAULT', 1: 'KEYWORD', 2: 'METHOD', 3: 'STR', 4: 'NUMBER', 5: 'COMMENT' }
        const mitraKw      = mitraKwMap[lang] || new Set()
        const mitraTokens  = []
        let i = 0

        const push = (content, type) => {
            if (!content) return
            const last = mitraTokens[mitraTokens.length - 1]
            if (last && last.highlightType === type) last.codeContent += content
            else mitraTokens.push({ codeContent: content, highlightType: type })
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
            if (c === '/' && code[i + 1] === '*') {
                let s = i; i += 2
                while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++
                i += 2
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
                if (mitraKw.has(word)) type = 1
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
            codeBlock:         mitraTokens,
            unified_codeBlock: mitraTokens.map(t => ({
                content: t.codeContent,
                type:    mitraTypeMap[t.highlightType]
            }))
        }
    }

    _buildTable(arr, title = '') {
        if (!Array.isArray(arr) || arr.length < 2)
            throw new Error('Table minimal 2 baris (header + 1 data)')
        const [header, ...rows] = arr
        const maxLen    = Math.max(header.length, ...rows.map(r => r.length))
        const normalize = r => [...r, ...Array(maxLen - r.length).fill('')]
        const unified_rows = [
            { is_header: true,  cells: normalize(header) },
            ...rows.map(r => ({ is_header: false, cells: normalize(r) }))
        ]
        return {
            title,
            rows: unified_rows.map(r => ({
                items: r.cells,
                ...(r.is_header ? { isHeading: true } : {})
            })),
            unified_rows
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { Button, ButtonLegacy, Carousel, AIRich, ProgressStep }