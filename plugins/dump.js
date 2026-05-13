let handler = async (m, { conn }) => {
    if (!m.quoted) throw 'Reply sebuah pesan terlebih dahulu!'
    const raw = global.rawMessages?.get(m.quoted.id)
    if (!raw) throw 'Raw object tidak ditemukan (pesan terlalu lama atau belum tercapture)'

    const jsonContent = JSON.stringify(raw, null, 2)
    const headerText = `*🔍 Raw Message*\n*🆔 ID :* ${m.quoted.id}`

    let codeBlocks = []
    let lastIndex = 0
    let match

    const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|((["'`])(?:\\.|[^\\])*?\3)|\b(let|const|var|function|async|await|return|if|else|for|while|class|import|export|from|try|catch|new|this|typeof|instanceof|switch|case|break|continue|default|throw|delete|yield)\b|\b(true|false|null|undefined|NaN)\b|\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g

    while ((match = tokenRegex.exec(jsonContent)) !== null) {
        if (match.index > lastIndex) {
            codeBlocks.push({ highlightType: 0, codeContent: jsonContent.substring(lastIndex, match.index) })
        }
        if (match[1])           codeBlocks.push({ highlightType: 4, codeContent: match[0] })
        else if (match[2])      codeBlocks.push({ highlightType: 2, codeContent: match[0] })
        else if (match[4])      codeBlocks.push({ highlightType: 1, codeContent: match[0] })
        else if (match[5] || match[6]) codeBlocks.push({ highlightType: 3, codeContent: match[0] })
        lastIndex = tokenRegex.lastIndex
    }

    if (lastIndex < jsonContent.length) {
        codeBlocks.push({ highlightType: 0, codeContent: jsonContent.substring(lastIndex) })
    }

    await conn.relayMessage(m.chat, {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        { messageType: 2, messageText: headerText },
                        { messageType: 5, codeMetadata: { codeLanguage: 'javascript', codeBlocks } }
                    ],
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: { botJid: '867051314767696@s.whatsapp.net' },
                        forwardOrigin: 4
                    }
                }
            }
        }
    }, {
        quoted: m,
        messageId: conn.generateMessageTag ? conn.generateMessageTag() : m.key.id
    })
}
handler.help = ['raw']
handler.tags = ['tools']
handler.command = /^(raw|dump)$/i
module.exports = handler