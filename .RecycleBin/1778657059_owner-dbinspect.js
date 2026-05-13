let handler = async (m, { conn }) => {
    let chats = global.db.data.chats || {}
    let users = global.db.data.users || {}

    // Sample 5 chat entries
    let chatSample = Object.entries(chats).slice(0, 5).map(([id, val]) => {
        let keys = Object.keys(val)
        return `${id.slice(0, 15)}... → [${keys.join(', ')}]`
    }).join('\n')

    // Sample 5 user entries
    let userSample = Object.entries(users).slice(0, 5).map(([id, val]) => {
        let keys = Object.keys(val)
        return `${id.slice(0, 15)}... → [${keys.join(', ')}]`
    }).join('\n')

    // Scan semua chat: cari field ban-related
    let banFields = new Set()
    for (let val of Object.values(chats)) {
        for (let key of Object.keys(val)) {
            if (/ban|mute|block|silent/i.test(key)) banFields.add(key)
        }
    }

    // Scan semua user: cari field ban-related
    let userBanFields = new Set()
    for (let val of Object.values(users)) {
        for (let key of Object.keys(val)) {
            if (/ban|mute|block|silent/i.test(key)) userBanFields.add(key)
        }
    }

    let result = `📊 *DB INSPECT*\n\n` +
        `*Chat Ban-related fields:*\n> ${[...banFields].join(', ') || 'none'}\n\n` +
        `*User Ban-related fields:*\n> ${[...userBanFields].join(', ') || 'none'}\n\n` +
        `*Chat Sample (5):*\n${chatSample}\n\n` +
        `*User Sample (5):*\n${userSample}`

    m.reply(result)
}

handler.help = ['dbinspect']
handler.tags = ['owner']
handler.command = /^dbinspect$/i
handler.owner = true

module.exports = handler