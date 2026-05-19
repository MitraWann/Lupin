'use strict';

const path = require('path');
const fs   = require('fs');

function attachHandler(sock, phoneNumber, ownerJid, mainConn) {
    const whitelist = global.JADIBOT_WHITELIST || [];
    const pluginsDir = path.join(__dirname, '../plugins');
    const slavePlugins = {};

    for (const filename of whitelist) {
        const fullPath = path.join(pluginsDir, filename);
        if (!fs.existsSync(fullPath)) continue;
        try {
            delete require.cache[require.resolve(fullPath)];
            slavePlugins[filename] = require(fullPath);
        } catch (e) {
            console.error('[JadibotHandler] Gagal load plugin:', filename, e.message);
        }
    }

    const prefixRegex = new RegExp('^[' + (global.opts?.prefix || '\u200ExzXZ/i!#$%+£¢€¥^°¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const rawMsg of messages) {
            try {
                if (!rawMsg.message) continue;
                if (rawMsg.key.fromMe) continue;

                const m = await sock.serializeM(rawMsg).catch(() => null);
                if (!m) continue;

                const body = m.text || '';
                if (!prefixRegex.test(body)) continue;

                const usedPrefix = body[0];
                const parts      = body.slice(1).trim().split(/ +/);
                const command    = parts[0].toLowerCase();
                const args       = parts.slice(1);
                const text       = args.join(' ');
                const isOwner    = [ownerJid, ...(global.owner || []).map(o => o + '@s.whatsapp.net')].includes(m.sender);
                const isROwner   = (global.owner || []).map(o => o + '@s.whatsapp.net').includes(m.sender);
                const isAdmin    = m.isGroup ? (m.groupMetadata?.participants?.find(p => p.id === m.sender)?.admin != null) : false;

                for (const [filename, plugin] of Object.entries(slavePlugins)) {
                    if (!plugin) continue;

                    const handler = typeof plugin === 'function' ? plugin : plugin.handler;
                    const cmdDef  = typeof plugin === 'function' ? plugin.command : plugin.command;

                    if (typeof handler !== 'function') continue;
                    if (!cmdDef) continue;
                    if (plugin.customPrefix) continue;

                    const isOwner = typeof plugin === 'function' ? (plugin.owner || plugin.rowner) : (plugin.owner || plugin.rowner);
                    if (isOwner) continue;

                    const cmds  = Array.isArray(cmdDef) ? cmdDef : [cmdDef];
                    const match = cmds.some(c =>
                        c instanceof RegExp ? c.test(command) : c === command
                    );
                    if (!match) continue;

                    try {
                        await handler(m, { conn: sock, args, command, text, usedPrefix, isOwner, isROwner, isAdmin, mainConn, phoneNumber, ownerJid });
                    } catch (e) {
                        console.error('[JadibotHandler] Error plugin', filename, ':', e.message);
                        await sock.reply(m.chat, '❌ Error: ' + e.message, m);
                    }
                    break;
                }
            } catch (e) {
                console.error('[JadibotHandler] Error handle message:', e.message);
            }
        }
    });
}

module.exports = { attachHandler };
