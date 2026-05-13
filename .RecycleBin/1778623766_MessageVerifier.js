const { mitraVerify, TRUST_LEVELS } = require('../lib/MessageVerifier')

const mitraTRUST_EMOJI = {
    [TRUST_LEVELS.SELF]:        '🤖',
    [TRUST_LEVELS.DIRECT]:      '✅',
    [TRUST_LEVELS.TRUSTED_BOT]: '🛡️',
    [TRUST_LEVELS.META_AI]:     '🧠',
    [TRUST_LEVELS.CHANNEL]:     '📢',
    [TRUST_LEVELS.LOW]:         '⚠️',
    [TRUST_LEVELS.UNTRUSTED]:   '❌'
}

let handler = async (m, { conn }) => {
    if (!m.quoted) throw 'Reply pesan yang ingin dicek!'

    // m.quoted adalah objek custom handler, raw message ada di fakeObj
    const mitraRaw    = m.quoted.fakeObj
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
            `*Forward Origin:* ${mitraResult.forwardOrigin ?? '-'}`,
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