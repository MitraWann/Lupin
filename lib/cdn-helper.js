const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DB_PATH = path.join(process.cwd(), 'memo', 'cdn-storage.json')
const ID_LENGTH = 8 // panjang identifier (hex)

// Inisialisasi database
function initDB() {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}))
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

// Simpan data CDN, kembalikan identifier
function store(url, mediaKey, type, mediaKeyTimestamp) {
    const db = initDB()
    
    // Generate identifier unik
    let identifier
    do {
        identifier = crypto.randomBytes(ID_LENGTH / 2).toString('hex')
    } while (db[identifier]) // hindari collision

    // Simpan ke database
    db[identifier] = {
        url,
        mediaKey,
        type,
        mediaKeyTimestamp,
        savedAt: new Date().toISOString()
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
    return identifier
}

// Ambil data CDN dari identifier
function retrieve(identifier) {
    const db = initDB()
    return db[identifier] || null
}

// List semua identifier (untuk debugging)
function list() {
    const db = initDB()
    return Object.keys(db).map(id => ({
        id,
        type: db[id].type,
        savedAt: db[id].savedAt
    }))
}

// Hapus entry lama (retensi 30 hari)
function clean(maxAgeDays = 30) {
    const db = initDB()
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    let removed = 0
    
    for (let id in db) {
        if (new Date(db[id].savedAt).getTime() < cutoff) {
            delete db[id]
            removed++
        }
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
    return removed
}

module.exports = { store, retrieve, list, clean }