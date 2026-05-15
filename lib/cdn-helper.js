// lib/cdn-helper.js (FINAL dengan fungsi remove)
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const zlib = require('zlib')

const DB_PATH = path.join(process.cwd(), 'memo', 'cdn-storage.json')
const ID_LENGTH = 8
const MAX_AGE_DAYS = 30

// ── Kompresi ─────────────────────────────────────────────
function pack(data) {
    const json = JSON.stringify(data)
    const deflated = zlib.deflateSync(json)
    return deflated.toString('base64url')
}

function unpack(packed) {
    const buffer = Buffer.from(packed, 'base64url')
    const json = zlib.inflateSync(buffer).toString()
    return JSON.parse(json)
}

// ── Database ─────────────────────────────────────────────
function initDB() {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// ── CRUD ─────────────────────────────────────────────────
function store(url, mediaKey, type, mediaKeyTimestamp) {
    const db = initDB()
    let id
    do {
        id = crypto.randomBytes(ID_LENGTH / 2).toString('hex')
    } while (db[id])

    const data = {
        url,
        mediaKey,
        type,
        mediaKeyTimestamp,
        savedAt: new Date().toISOString()
    }
    db[id] = pack(data)
    saveDB(db)
    return id
}

function retrieve(id) {
    const db = initDB()
    const packed = db[id]
    if (!packed) return null
    return unpack(packed)
}

function remove(id) {
    const db = initDB()
    if (!db[id]) return false
    delete db[id]
    saveDB(db)
    return true
}

function list() {
    const db = initDB()
    return Object.keys(db).map(id => {
        const data = unpack(db[id])
        return { id, type: data.type, savedAt: data.savedAt }
    })
}

function clean(maxAgeDays = MAX_AGE_DAYS) {
    const db = initDB()
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    let removed = 0
    for (let id in db) {
        try {
            const data = unpack(db[id])
            if (new Date(data.savedAt).getTime() < cutoff) {
                delete db[id]
                removed++
            }
        } catch (e) {
            delete db[id]
            removed++
        }
    }
    saveDB(db)
    return removed
}

module.exports = { store, retrieve, remove, list, clean }