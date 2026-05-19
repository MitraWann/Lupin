const crypto = require('crypto');
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');

// Cache global
const _mediaCache = {
    data: null,
    ts: 0,
    TTL: 6 * 60 * 60 * 1000 // 6 jam
};

const thumbUrl = 'https://files.catbox.moe/vaq8z9.png';
const favUrl = 'https://files.catbox.moe/erti1c.png';
const link = 'https://made.by.mitra';


async function getMediaCache(conn) {
    const now = Date.now();
    if (_mediaCache.data && (now - _mediaCache.ts) < _mediaCache.TTL) {
        return _mediaCache.data;
    }
    if (!conn.waUploadToServer) throw new Error('[menu] waUploadToServer belum siap')
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

async function sendMenu(conn, chat, title, description, text) {
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

function getCategorized() {
    const categorized = {};
    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        if (plugin && Array.isArray(plugin.help) && plugin.help.length > 0) {
            const tag = (Array.isArray(plugin.tags) && plugin.tags[0]) ? plugin.tags[0].toLowerCase() : 'other';
            if (!categorized[tag]) categorized[tag] = [];
            for (const cmd of plugin.help) {
                const cleanCmd = cmd.trim();
                if (cleanCmd && !categorized[tag].includes(cleanCmd)) {
                    categorized[tag].push(cleanCmd);
                }
            }
        }
    }
    for (const tag in categorized) {
        categorized[tag].sort((a, b) => a.localeCompare(b));
    }
    return categorized;
}

function getSortedTags(categorized) {
    return Object.keys(categorized).sort((a, b) => {
        if (a === 'main') return -1;
        if (b === 'main') return 1;
        if (a === 'other') return 1;
        if (b === 'other') return -1;
        return a.localeCompare(b);
    });
}

function buildCategoryList(categorized, sortedTags) {
    let text = '```~$ list --menu\n\n';
    let index = 1;
    for (const tag of sortedTags) {
        const count = categorized[tag].length;
        text += `→${tag} [${count}]\n`;
        index++;
    }
    const total = Object.values(categorized).reduce((a, b) => a + b.length, 0);
    text += `\n────────────────\n${total} commands\n.menu <kategori>\n.menu all\n\`\`\``;
    return text;
}

function buildSingleCategory(tag, cmds) {
    let text = `\`\`\`~$ listmenu --${tag}\n\n→${tag}\n`;
    for (const cmd of cmds) {
        text += `• ${cmd}\n`;
    }
    text += `\n────────────────\n${cmds.length} commands\`\`\``;
    return text;
}

function buildAllCategories(categorized, sortedTags) {
    let text = '```~$ list --all\n\n';
    for (const tag of sortedTags) {
        const cmds = categorized[tag];
        text += `→${tag}\n`;
        for (const cmd of cmds) {
            text += `• ${cmd}\n`;
        }
        text += '\n';
    }
    const total = Object.values(categorized).reduce((a, b) => a + b.length, 0);
    text += `────────────────\n${total} commands\`\`\``;
    return text;
}

let handler = async (m, { conn }) => {
    const { version } = require('/home/container/package.json');
    const arg = m.text.trim().split(' ').slice(1).join(' ').toLowerCase().trim();
    const categorized = getCategorized();
    const sortedTags = getSortedTags(categorized);

    if (!arg) {
        const text = buildCategoryList(categorized, sortedTags);
        return sendMenu(conn, m.chat, `Flora🍀 v${version}`, 'Pilih kategori menu', text);
    }

    if (arg === 'all') {
        const text = buildAllCategories(categorized, sortedTags);
        return sendMenu(conn, m.chat, `Flora🍀 v${version} — All Commands`, 'Semua perintah tersedia', text);
    }

    if (!categorized[arg]) {
        return m.reply(`Kategori *${arg}* tidak ditemukan.\nKategori tersedia: ${sortedTags.join(', ')}`);
    }

    const text = buildSingleCategory(arg, categorized[arg]);
    return sendMenu(conn, m.chat, `Flora🍀 v${version} — Menu ${arg}`, `${categorized[arg].length} perintah tersedia`, text);
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = /^menu(?:\s+(.+))?$/i;

module.exports = handler;