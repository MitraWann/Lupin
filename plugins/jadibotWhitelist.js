
'use strict';

const path = require('path');
const fs   = require('fs');

const pluginsDir = path.join(__dirname, '../plugins');
const configPath = path.join(__dirname, '../config.js');

function _saveWhitelist() {
    try {
        let content = fs.readFileSync(configPath, 'utf8');
        const newVal = JSON.stringify(global.JADIBOT_WHITELIST || [], null, 4);
        content = content.replace(
            /global\.JADIBOT_WHITELIST\s*=\s*\[[\s\S]*?\];/,
            `global.JADIBOT_WHITELIST = ${newVal};`
        );
        fs.writeFileSync(configPath, content, 'utf8');
    } catch (e) {
        console.error('[wlbot] Gagal simpan whitelist ke config.js:', e.message);
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'list') {
        const list = global.JADIBOT_WHITELIST || [];
        if (!list.length) return conn.reply(m.chat, '📋 Whitelist kosong.', m);
        return conn.reply(m.chat, [
            '╭─「 *WHITELIST JADIBOT* 」',
            ...list.map((f, i) => `│ ${i + 1}. ${f}`),
            '╰──────────────────'
        ].join('\n'), m);
    }

    if (sub === 'add') {
        const filename = args[1];
        if (!filename) return conn.reply(m.chat, `Penggunaan: *${usedPrefix}${command} add namafile.js*`, m);
        if (filename === 'all') {
            const allFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
            global.JADIBOT_WHITELIST = [...new Set([...(global.JADIBOT_WHITELIST || []), ...allFiles])];
            _saveWhitelist();
            return conn.reply(m.chat, `✅ Semua plugin (${allFiles.length}) ditambahkan ke whitelist.`, m);
        }

        global.JADIBOT_WHITELIST = global.JADIBOT_WHITELIST || [];
        if (global.JADIBOT_WHITELIST.includes(filename))
            return conn.reply(m.chat, `⚠️ *${filename}* sudah ada di whitelist.`, m);

        global.JADIBOT_WHITELIST.push(filename);
        _saveWhitelist();
        return conn.reply(m.chat, `✅ *${filename}* ditambahkan ke whitelist.`, m);
    }

    if (sub === 'del' || sub === 'remove') {
        const target = args[1];
        if (!target) return conn.reply(m.chat, `Penggunaan: *${usedPrefix}${command} del namafile.js*`, m);

        if (target === 'all') {
            global.JADIBOT_WHITELIST = [];
            _saveWhitelist();
            return conn.reply(m.chat, '✅ Semua plugin dihapus dari whitelist.', m);
        }

        global.JADIBOT_WHITELIST = global.JADIBOT_WHITELIST || [];
        const idx = global.JADIBOT_WHITELIST.indexOf(target);
        if (idx === -1) return conn.reply(m.chat, `❌ *${target}* tidak ada di whitelist.`, m);

        global.JADIBOT_WHITELIST.splice(idx, 1);
        _saveWhitelist();
        return conn.reply(m.chat, `✅ *${target}* dihapus dari whitelist.`, m);
    }

    if (sub === 'available') {
        const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
        const wl    = global.JADIBOT_WHITELIST || [];
        const text  = files.map(f => (wl.includes(f) ? '✅' : '⬜') + ' ' + f).join('\n');
        return conn.reply(m.chat, '╭─「 *PLUGINS TERSEDIA* 」\n│\n' + text.split('\n').map(l => '│ ' + l).join('\n') + '\n╰──────────────────', m);
    }

    return conn.reply(m.chat, [
        `*Penggunaan ${usedPrefix}${command}:*`,
        `• ${usedPrefix}${command} list — tampilkan whitelist`,
        `• ${usedPrefix}${command} add <file.js> — tambah plugin`,
        `• ${usedPrefix}${command} del <file.js> — hapus plugin`,
        `• ${usedPrefix}${command} available — lihat semua plugin`,
        `• ${usedPrefix}${command} add all — tambah semua plugin`,
        `• ${usedPrefix}${command} del all — hapus semua plugin`,
    ].join('\n'), m);
};

handler.help        = ['wlbot <list|add|del|available>'];
handler.tags        = ['owner'];
handler.command     = /^(wlbot|whitelistbot)$/i;
handler.owner       = true;
handler.rowner      = false;
handler.description = 'Kelola whitelist plugin bot slave';

module.exports = handler;
