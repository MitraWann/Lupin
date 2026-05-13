let handler = async (m, { conn }) => {
    const { mitraVerify } = require('../lib/MessageVerifier')

    const mitraTRUST_EMOJI = {
        SELF:        '🤖',
        DIRECT:      '✅',
        TRUSTED_BOT: '🛡️',
        META_AI:     '🧠',
        CHANNEL:     '📢',
        LOW:         '⚠️',
        UNTRUSTED:   '❌'
    }

    if (!m.quoted) throw 'Reply pesan yang ingin dicek!'

    const mitraRaw = m.quoted.fakeObj
    if (!mitraRaw?.message) throw 'Tidak dapat membaca struktur pesan ini.'

    const mitraResult = mitraVerify(mitraRaw)
    const mitraEmoji  = mitraTRUST_EMOJI[mitraResult.trustLevel] ?? '❓'

    const mitraLines = [
        `${mitraEmoji} *Trust Verification*`,
        ``,
        `*Trust Level:* ${mitraResult.trustLevel}`,
        `*Alasan:* ${mitraResult.trustReason}`,
        `*Dipercaya:* ${mitraResult.isTrusted ? 'Ya' : 'Tidak'}`,
        ``,
        `*Pengirim:* ${mitraResult.sender || '-'}`,
        `*Tipe Pesan:* ${mitraResult.messageType || '-'}`,
        ``,
        `*Di-forward:* ${mitraResult.isForwarded ? 'Ya' : 'Tidak'}`,
        ...(mitraResult.isForwarded ? [
            `*Forward Score:* ${mitraResult.forwardScore}`,
            `*Forward Origin:* ${{ 0:'UNKNOWN', 1:'CHAT', 2:'STATUS', 3:'CHANNELS', 4:'META_AI', 5:'UGC' }[mitraResult.forwardOrigin] ?? mitraResult.forwardOrigin ?? '-'}`,
        ] : []),
        ...(mitraResult.isBot ? [
            ``,
            `*Bot JID:* ${mitraResult.botJid}`,
            `*Meta AI:* ${mitraResult.isMetaAI ? 'Ya' : 'Tidak'}`,
            `*Trusted Bot:* ${mitraResult.isTrustedBot ? 'Ya' : 'Tidak'}`,
        ] : []),
        ...(mitraResult.isChannel ? [
            ``,
            `*Channel:* ${mitraResult.channelName ?? '-'}`,
            `*Channel JID:* ${mitraResult.channelJid ?? '-'}`,
        ] : []),
    ]

    conn.reply(m.chat, mitraLines.join('\n'), m)
}

handler.help = ['trust <reply pesan>']
handler.tags = ['tools']
handler.command = /^(trust)$/i

module.exports = handler