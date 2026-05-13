'use strict'
function mitraVerify(msg) {
    if (!msg || typeof msg !== 'object') throw new TypeError('msg harus object')
    const mitraKey = Object.keys(msg.message || {})[0]
    const mitraCtx = msg.message?.[mitraKey]?.contextInfo ?? {}
    const mitraSender = msg.key?.participant || msg.key?.remoteJid || ''
    const mitraFromMe = msg.key?.fromMe ?? false
    const mitraIsForwarded = mitraCtx.isForwarded ?? false
    const mitraForwardScore = mitraCtx.forwardingScore ?? 0
    const mitraForwardOrigin = mitraCtx.forwardOrigin ?? null
    const mitraBotJid = mitraCtx.forwardedAiBotMessageInfo?.botJid ?? null
    const mitraIsBot = !!mitraBotJid
    const mitraIsMetaAI = mitraForwardOrigin === 'META_AI' || mitraBotJid === '718584497008509@bot'
    const mitraIsTrustedBot = mitraIsBot && mitraBotJid === '718584497008509@bot'
    const mitraChannelInfo = mitraCtx.forwardedNewsletterMessageInfo ?? null
    const mitraIsChannel = !!mitraChannelInfo
    let mitraTrustLevel, mitraTrustReason
    if (mitraFromMe) { mitraTrustLevel = 'SELF'; mitraTrustReason = 'Pesan dari bot sendiri' }
    else if (!mitraIsForwarded) { mitraTrustLevel = 'DIRECT'; mitraTrustReason = 'Pesan langsung, tidak di-forward' }
    else if (mitraIsTrustedBot) { mitraTrustLevel = 'TRUSTED_BOT'; mitraTrustReason = 'Forward dari bot terpercaya: ' + mitraBotJid }
    else if (mitraIsMetaAI) { mitraTrustLevel = 'META_AI'; mitraTrustReason = 'Forward dari Meta AI' }
    else if (mitraIsChannel) { mitraTrustLevel = 'CHANNEL'; mitraTrustReason = 'Forward dari channel: ' + (mitraChannelInfo?.newsletterName ?? mitraChannelInfo?.newsletterJid) }
    else if (mitraForwardScore <= 1) { mitraTrustLevel = 'LOW'; mitraTrustReason = 'Forward 1x, sumber masih bisa dilacak' }
    else { mitraTrustLevel = 'UNTRUSTED'; mitraTrustReason = 'Forward ' + mitraForwardScore + 'x, sumber tidak bisa diverifikasi' }
    return { sender: mitraSender, fromMe: mitraFromMe, messageType: mitraKey ?? null, isForwarded: mitraIsForwarded, forwardScore: mitraForwardScore, forwardOrigin: mitraForwardOrigin, isBot: mitraIsBot, botJid: mitraBotJid, isMetaAI: mitraIsMetaAI, isTrustedBot: mitraIsTrustedBot, isChannel: mitraIsChannel, channelJid: mitraChannelInfo?.newsletterJid ?? null, channelName: mitraChannelInfo?.newsletterName ?? null, trustLevel: mitraTrustLevel, trustReason: mitraTrustReason, isTrusted: ['SELF','DIRECT','TRUSTED_BOT','META_AI'].includes(mitraTrustLevel) }
}
function mitraIsTrusted(msg) { return mitraVerify(msg).isTrusted }
module.exports = { mitraVerify, mitraIsTrusted }
