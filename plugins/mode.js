const crypto = require('crypto');
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');

const _mediaCache = {
    data: null,
    ts: 0,
    TTL: 6 * 60 * 60 * 1000
};

const thumbUrl = 'https://files.catbox.moe/vaq8z9.png';
const favUrl = 'https://files.catbox.moe/erti1c.png';
const link = 'https://made.by.mitra';

async function getMediaCache(conn) {
    const now = Date.now();
    if (_mediaCache.data && (now - _mediaCache.ts) < _mediaCache.TTL) {
        return _mediaCache.data;
    }
    if (!conn.waUploadToServer) throw new Error('[mode] waUploadToServer belum siap')
    const thumbBuffer = await conn.getFile(thumbUrl).then(f => f.data);
    const favBuffer = await conn.getFile(favUrl).then(f => f.data);
    const [thumbWAMC, favWAMC] = await Promise.all([
        prepareWAMessageMedia({ image: thumbBuffer }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: 'thumbnail-link'
        }),
        prepareWAMessageMedia({ image: favBuffer }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: 'thumbnail-link'
        })
    ]);
    _mediaCache.data = {
        th: thumbWAMC.imageMessage,
        fv: favWAMC.imageMessage
    };
    _mediaCache.ts = now;
    return _mediaCache.data;
}

async function sendMode(conn, chat, title, description, text) {
    const { th, fv } = await getMediaCache(conn);
    await conn.relayMessage(chat, {
        messageContextInfo: {
            messageSecret: crypto.randomBytes(32)
        },
        extendedTextMessage: {
            text: `${link}\n${text}`,
            matchedText: link,
            canonicalUrl: link,
            title,
            description,
            previewType: 0,
            jpegThumbnail: th.jpegThumbnail,
            thumbnailDirectPath: th.directPath,
            thumbnailSha256: th.fileSha256,
            thumbnailEncSha256: th.fileEncSha256,
            mediaKey: th.mediaKey,
            mediaKeyTimestamp: Number(th.mediaKeyTimestamp),
            thumbnailWidth: th.width || 512,
            thumbnailHeight: th.height || 512,
            inviteLinkGroupTypeV2: 0,
            faviconMMSMetadata: {
                thumbnailDirectPath: fv.directPath,
                thumbnailSha256: fv.fileSha256,
                thumbnailEncSha256: fv.fileEncSha256,
                mediaKey: fv.mediaKey,
                mediaKeyTimestamp: Number(fv.mediaKeyTimestamp),
                thumbnailHeight: Math.min(fv.height || 96, 96),
                thumbnailWidth: Math.min(fv.width || 96, 96)
            }
        }
    }, {});
}

let handler = async (m, { conn }) => {
    let setting = global.db.data.settings?.[conn.user?.jid] || {}
    let modeBot = '🔓 Publik'
    if (global.opts['self'] || global.db.data.settings?.self) modeBot = '🔒 Self'
    else if (setting.onlyAdmin) modeBot = '🛡️ Only Admin'

    let _uptime = process.uptime() * 1000
    let uptimex = clockString(_uptime)

    let totalUsers = Object.keys(global.db.data.users).length
    let bannedUsers = Object.values(global.db.data.users).filter(user => user.banned).length
    let totalFeatures = Object.keys(global.db.data.stats || {}).length

    let teks = `╭┈┈⬡「 *STATUS  BOT* 」
┃ 🤖 *Mode:* ${modeBot}
┃ ⏱️ *Aktif:* ${uptimex}
┃ 👥 *Pengguna:* ${totalUsers} user
┃ 🚫 *Terbanned:* ${bannedUsers} user
╰┈┈⬡`

    try {
        await sendMode(conn, m.chat, 'Status Bot', `Runtime: ${uptimex}`, teks)
    } catch (e) {
        console.error('[mode]', e)
        m.reply(teks)
    }
}

handler.help = ['mode']
handler.tags = ['main']
handler.customPrefix = /^(mode)$/i
handler.command = new RegExp
handler.limit = false

module.exports = handler

function clockString(ms) {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    let daysms = ms % (24 * 60 * 60 * 1000);
    let hours = Math.floor((daysms) / (60 * 60 * 1000));
    let hoursms = ms % (60 * 60 * 1000);
    let minutes = Math.floor((hoursms) / (60 * 1000));
    let minutesms = ms % (60 * 1000);
    let sec = Math.floor((minutesms) / (1000));
    let result = '';
    if (days > 0) result += days + ' Hari ';
    if (hours > 0) result += hours + ' Jam ';
    if (minutes > 0) result += minutes + ' Menit ';
    result += sec + ' Detik';
    return result.trim();
}