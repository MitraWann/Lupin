'use strict'

const { jidDecode, getDevice } = require('@whiskeysockets/baileys')

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Ekstrak nomor telepon dari JID.
 * Contoh: "628123@s.whatsapp.net" → "628123"
 *         "628123@lid"            → "628123 (lid)"
 * @param {string} jid
 */
const jidToNum = (jid = '') => {
    if (!jid) return '—'
    const decoded = jidDecode(jid)
    if (!decoded) return jid
    const { user, server } = decoded
    return server === 'lid' ? `${user} (lid)` : user
}

/**
 * Coba dapatkan device dari key.id Baileys.
 * getDevice bisa throw jika id tidak valid, jadi dibungkus try/catch.
 * @param {string} id
 */
const safeGetDevice = (id = '') => {
    try { return getDevice(id) } catch { return 'unknown' }
}

// ── Handler ───────────────────────────────────────────────────────────────────

/**
 * Plugin: inspect message
 * Cara pakai:
 *   - Ketik perintah sendiri  → inspect pesan kamu sendiri
 *   - Reply ke pesan lain     → inspect pesan yang di-reply
 *   - Uji coba via eval: > require('./plugins/inspect-message').call(conn, m, { conn, usedPrefix: '>', noPrefix: 'im', args: [], text: '', command: 'im' })
 */
let handler = async function (m, { conn, usedPrefix, groupMetadata, participants, isAdmin, isROwner, isOwner }) {

    // Target: quoted message jika ada, kalau tidak, pesan pengirim itu sendiri
    const target  = m.quoted || m
    const isGroup = m.chat.endsWith('@g.us')

    // ── Sender info ───────────────────────────────────────────────────────────
    const senderJid    = target.sender          || '—'
    const senderDb     = target.dbSender        || senderJid
    const senderNum    = jidToNum(senderDb)
    const pushName     = target.pushName        || target.name || '—'
    const device       = safeGetDevice(target.key?.id || '')
    const fromMe       = target.fromMe ? 'ya' : 'tidak'

    // ── Group info ────────────────────────────────────────────────────────────
    let adminStatus = '—'
    if (isGroup) {
        const pts = groupMetadata?.participants || participants || []
        const found = pts.find(p =>
            (p.jid || p.id || p.phoneNumber) === senderJid ||
            (p.jid || p.id || p.phoneNumber) === senderDb
        )
        if (found) {
            adminStatus = found.admin === 'superadmin' ? 'superadmin'
                        : found.admin === 'admin'      ? 'admin'
                        : 'bukan admin'
        } else {
            adminStatus = 'tidak ditemukan'
        }
    } else {
        adminStatus = 'bukan di grup'
    }

    // ── DB info ───────────────────────────────────────────────────────────────
    const userDb  = global.db?.data?.users?.[senderDb] || {}
    const banned  = userDb.banned ? `ya (warn: ${userDb.warn || 0})` : 'tidak'
    const premium = (userDb.premiumTime > 0 || userDb.premium) ? 'ya' : 'tidak'
    const level   = userDb.level   ?? '—'
    const exp     = userDb.exp     ?? '—'
    const limit   = userDb.limit   ?? '—'
    const token   = userDb.token   ?? '—'
    const regis   = userDb.registered ? 'ya' : 'belum'
    const cmdCount = userDb.command ?? '—'

    // ── Message info ──────────────────────────────────────────────────────────
    const msgId   = target.key?.id   || '—'
    const msgType = target.type      || target.mtype || '—'
    const chatJid = target.key?.remoteJid || m.chat
    const msgText = target.text != null
        ? (String(target.text).slice(0, 300) || '(kosong)')
        : '(tidak ada teks)'

    // ── Susun output ──────────────────────────────────────────────────────────
    const block = (content) => '```' + content + '```\n'

    const accountBlock = block(
        `name  : ${pushName}\n` +
        `device: ${device}\n` +
        `num   : ${senderNum}\n` +
        `jid   : ${senderDb}\n` +
        `fromMe: ${fromMe}\n` +
        `admin : ${adminStatus}`
    )

    const dbBlock = block(
        `banned : ${banned}\n` +
        `premium: ${premium}\n` +
        `reg    : ${regis}\n` +
        `level  : ${level}\n` +
        `exp    : ${exp}\n` +
        `limit  : ${limit}\n` +
        `token  : ${token}\n` +
        `cmds   : ${cmdCount}`
    )

    const msgBlock =
        block(
            `id  : ${msgId}\n` +
            `type: ${msgType}\n` +
            `chat: ${chatJid}`
        ) +
        block(`text:\n${msgText}`)

    const print =
        '👤 *account*\n'  + accountBlock +
        '🗄️ *database*\n'  + dbBlock +
        '✉️ *message*\n'   + msgBlock

    return m.reply(print)
}

// ── Metadata ──────────────────────────────────────────────────────────────────
handler.help        = ['im']
handler.tags        = ['tools']
handler.command     = /^im$/i
handler.customPrefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/i   // ikut prefix global

// Permission — hanya mods yang boleh pakai
handler.mods        = true
handler.owner       = false
handler.rowner      = false
handler.group       = false
handler.private     = false
handler.premium     = false
handler.admin       = false
handler.botAdmin    = false

handler.fail        = null

module.exports = handler