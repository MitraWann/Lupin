let handler = async (m, { conn, text, usedPrefix, command }) => {
    let botJid = conn.user.jid
    let settings = global.db.data.settings[botJid]
    if (typeof settings !== 'object') global.db.data.settings[botJid] = {}
    settings = global.db.data.settings[botJid]
    if (!settings.disabledCmds) settings.disabledCmds = []

    if (!text) {
        let list = settings.disabledCmds.length > 0 
            ? settings.disabledCmds.map(v => '❌ ' + v).join('\n') 
            : '🟢 Semua fitur menyala.'
            
        return m.reply(
            `⚙️ *PANEL KONTROL FITUR*\n\n` +
            `*Format Penggunaan:*\n` +
            `> ${usedPrefix}dcmd <nama_command>\n` +
            `> ${usedPrefix}ecmd <nama_command>\n\n` +
            `*Daftar Fitur Mati:*\n${list}`
        )
    }

    let cmdTarget = text.toLowerCase().trim()
    let protectedCmds = ['dcmd', 'ecmd', 'disablecmd', 'enablecmd']
    if (protectedCmds.includes(cmdTarget)) {
        return m.reply('⚠️ *Dilarang!* Boss tidak boleh mematikan sistem saklar utama ini.')
    }

    if (command === 'dcmd' || command === 'disablecmd') {
        if (settings.disabledCmds.includes(cmdTarget)) return m.reply(`Fitur '${cmdTarget}' sudah dalam keadaan mati.`)
        
        settings.disabledCmds.push(cmdTarget)
        m.reply(`✅ *FITUR DIMATIKAN*\n\nSemua member tidak akan bisa lagi menggunakan perintah *${usedPrefix}${cmdTarget}*.`)
    } 
    else if (command === 'ecmd' || command === 'enablecmd') {
        if (!settings.disabledCmds.includes(cmdTarget)) return m.reply(`Fitur '${cmdTarget}' tidak ada dalam daftar mati.`)
        
        settings.disabledCmds = settings.disabledCmds.filter(v => v !== cmdTarget)
        m.reply(`✅ *FITUR DINYALAKAN*\n\nPerintah *${usedPrefix}${cmdTarget}* sekarang bisa digunakan kembali.`)
    }
}

// ==========================================
// MESIN PENCEGAT JALUR VVIP (ALL HOOK)
// ==========================================
// Kita gunakan 'all' bukan 'before' agar dieksekusi paling awal!
handler.all = async function (m) {
    let conn = this || global.conn
    if (!m.text || m.isBaileys) return
    
    let botJid = conn.user.jid
    let settings = global.db.data.settings[botJid] || {}
    
    if (!settings.disabledCmds || settings.disabledCmds.length === 0) return

    let isCommand = /^[\\/!#.\-]/i.test(m.text)
    if (!isCommand) return

    let cmdName = m.text.split(' ')[0].toLowerCase().replace(/^[\\/!#.\-]/, '')

    if (settings.disabledCmds.includes(cmdName)) {
        await m.reply(`❌ *FITUR DIMATIKAN*\n\nMaaf, fitur *${cmdName}* sedang dinonaktifkan sementara oleh Owner.`)
        
        // PENGHANCURAN IDENTITAS PESAN (MUTASI)
        // Kita timpa pesannya menjadi kata acak agar regex bot tidak bisa menemukan fiturnya
        m.text = 'BLOCKED_CMD_123'
        m.command = 'BLOCKED_CMD_123'
        m.body = 'BLOCKED_CMD_123'
        m.args = []
        
        if (m.message) {
            if (m.message.conversation) m.message.conversation = 'BLOCKED_CMD_123'
            if (m.message.extendedTextMessage) m.message.extendedTextMessage.text = 'BLOCKED_CMD_123'
        }
        
        return true 
    }
}

handler.help = ['disablecmd <command>', 'enablecmd <command>']
handler.tags = ['owner']
handler.command = /^(dcmd|ecmd|disablecmd|enablecmd)$/i
handler.owner = true

module.exports = handler