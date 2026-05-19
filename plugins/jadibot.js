
'use strict';

const { createInstance, stopInstance, listInstances, hasInstance, instanceCount } = require('../lib/jadibotManager');

const waitingInput = new Map(); // senderJid → { time }

let handler = async (m, { conn, usedPrefix, command, args }) => {
    const senderJid = m.sender;
    const chatJid   = m.chat;

    // ── .stopbot ──────────────────────────────────────────────
    if (command === 'stopbot') {
        let target = args[0]?.replace(/\D/g, '');
        if (!target) {
            const mine = listInstances().find(i => i.owner === senderJid);
            if (!mine) return conn.reply(chatJid, '❌ Kamu tidak punya bot aktif.', m);
            target = mine.number;
        }
        const result = await stopInstance(target, senderJid);
        return conn.reply(chatJid, result.ok ? '✅ ' + result.msg : '❌ ' + result.msg, m);
    }

    // ── .listbot ──────────────────────────────────────────────
    if (command === 'listbot') {
        const isOwner = global.owner?.includes(senderJid.split('@')[0]);
        if (!isOwner) return conn.reply(chatJid, '❌ Hanya owner yang bisa melihat list bot.', m);
        const list = listInstances();
        if (!list.length) return conn.reply(chatJid, '📋 Tidak ada bot slave aktif.', m);
        const text = list.map((i, n) =>
            `${n + 1}. *+${i.number}*\n   Owner: ${i.owner.split('@')[0]}\n   Status: ${i.status}`
        ).join('\n\n');
        return conn.reply(chatJid, '╭─「 *LIST JADIBOT* 」\n│\n' + text.split('\n').map(l => '│ ' + l).join('\n') + '\n╰──────────────────', m);
    }

    // ── .jadibot — entry point ────────────────────────────────
    waitingInput.set(senderJid, Date.now());
    return conn.reply(chatJid, [
        '╭─「 *JADIBOT* 」',
        '│',
        '│ Masukkan nomor yang ingin',
        '│ dijadikan bot, sertakan',
        '│ kode negara.',
        '│',
        '│ Contoh: *628xxxxxxxxxx*',
        '│',
        '│ Ketik *batal* untuk membatalkan.',
        '╰──────────────────'
    ].join('\n'), m);
};

handler.before = async function (m, { conn }) {
    const senderJid = m.sender;
    if (!waitingInput.has(senderJid)) return false;

    const text = m.text?.trim() || '';

    if (text.toLowerCase() === 'batal') {
        waitingInput.delete(senderJid);
        await conn.reply(m.chat, '✅ Dibatalkan.', m);
        return true;
    }

    // Jika bukan command jadibot/stopbot/listbot, anggap sebagai input nomor
    const isJadibotCmd = /^(jadibot|jadbot|stopbot|listbot)$/i.test(
        text.replace(/^[^a-zA-Z0-9]+/, '').split(' ')[0]
    );
    if (isJadibotCmd) return false;

    // Proses input nomor
    const entry = waitingInput.get(senderJid);
    if (Date.now() - entry > 2 * 60 * 1000) {
        waitingInput.delete(senderJid);
        await conn.reply(m.chat, '⏱ Waktu habis. Kirim *.jadibot* lagi untuk memulai ulang.', m);
        return true;
    }

    const input = text.replace(/\D/g, '');
    if (!input || input.length < 10 || input.length > 15) {
        await conn.reply(m.chat, '❌ Nomor tidak valid. Masukkan nomor dengan kode negara.\nContoh: *628xxxxxxxxxx*', m);
        return true;
    }

    waitingInput.delete(senderJid);

    const maxSlot = global.JADIBOT_MAX || 3;
    if (instanceCount() >= maxSlot) {
        await conn.reply(m.chat, `❌ Slot bot penuh! Maksimal *${maxSlot}* bot aktif bersamaan.`, m);
        return true;
    }
    if (hasInstance(input)) {
        await conn.reply(m.chat, `❌ Nomor *+${input}* sudah aktif sebagai bot.`, m);
        return true;
    }

    await conn.reply(m.chat, `⏳ Memproses nomor *+${input}*...\nKode pairing akan dikirim sebentar lagi.`, m);
    try {
        await createInstance(input, senderJid, conn, m.chat);
    } catch (e) {
        console.error('[jadibot] createInstance error:', e.message);
        await conn.reply(m.chat, '❌ Gagal membuat instance: ' + e.message, m);
    }
    return true;
};

handler.help        = ['jadibot', 'stopbot', 'listbot'];
handler.tags        = ['tools'];
handler.command     = /^(jadibot|jadbot|stopbot|listbot)$/i;
handler.owner       = false;
handler.rowner      = false;
handler.description = 'Jadikan nomor sebagai bot slave Flora';

module.exports = handler;
