const Database = require('better-sqlite3')

// Loaded via baileys-loader di main.js
module.exports = async function useSQLiteAuthState(dbPath) {
    const { loadBaileys } = await import('../baileys-loader.mjs')
    const baileys = await loadBaileys()
    const { BufferJSON, initAuthCreds, proto } = baileys

    const dir = require('path').dirname(dbPath)
    if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true })
    const db = new Database(dbPath)

    db.exec(`
        CREATE TABLE IF NOT EXISTS auth (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `)

    const get = db.prepare('SELECT value FROM auth WHERE key = ?')
    const set = db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)')
    const del = db.prepare('DELETE FROM auth WHERE key = ?')
    const keys = db.prepare('SELECT key FROM auth WHERE key LIKE ?')

    function readData(key) {
        const row = get.get(key)
        if (!row) return null
        return JSON.parse(row.value, BufferJSON.reviver)
    }

    function writeData(key, data) {
        set.run(key, JSON.stringify(data, BufferJSON.replacer))
    }

    function removeData(key) {
        del.run(key)
    }

    const creds = readData('creds') || initAuthCreds()

    return {
        state: {
            creds,
            keys: {
                get(type, ids) {
                    const result = {}
                    for (const id of ids) {
                        const key = `${type}-${id}`
                        let val = readData(key)
                        if (type === 'app-state-sync-key' && val) {
                            val = proto.Message.AppStateSyncKeyData.fromObject(val)
                        }
                        result[id] = val
                    }
                    return result
                },
                set(data) {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const key = `${category}-${id}`
                            const val = data[category][id]
                            if (val) writeData(key, val)
                            else removeData(key)
                        }
                    }
                }
            }
        },
        saveCreds() {
            writeData('creds', creds)
        }
    }
}