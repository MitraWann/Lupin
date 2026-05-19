// plugins/owner-updver.js

const fs = require('fs')
const path = require('path')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const pkgPath = path.join(process.cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const oldVersion = pkg.version

    let [major, minor, patch] = oldVersion.split('.').map(Number)

    const arg = (text || '').trim().toLowerCase()

    if (/^\d+\.\d+\.\d+$/.test(arg)) {
        pkg.version = arg
    } else if (arg === 'major') {
        pkg.version = `${major + 1}.0.0`
    } else if (arg === 'minor') {
        pkg.version = `${major}.${minor + 1}.0`
    } else if (arg === 'patch' || !arg) {
        pkg.version = `${major}.${minor}.${patch + 1}`
    } else {
        throw `Argumen tidak valid!\n\nContoh:\n${usedPrefix + command} patch\n${usedPrefix + command} minor\n${usedPrefix + command} major\n${usedPrefix + command} 1.2.3`
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    conn.reply(m.chat, `✅ Versi berhasil diperbarui!\n\n*${oldVersion}* → *${pkg.version}*\n\n🔄 Bot restarting...`, m)
    setTimeout(() => process.exit(0), 2000)
}

handler.help = ['updver <patch|minor|major|x.x.x>']
handler.tags = ['owner']
handler.command = /^(updver|updateversion)$/i
handler.owner = true

module.exports = handler