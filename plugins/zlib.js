const { ZLibClient } = require('../lib/scrape/zlib.js');

const client = new ZLibClient();

// Session hasil search per user (in-memory)
const searchCache = new Map();

function formatBooks(books) {
  return books.map(b =>
    `*${b.index}.* ${b.title}\n` +
    `   👤 ${b.author || 'Unknown'}\n` +
    `   📅 ${b.year || '-'} | 📄 ${b.extension?.toUpperCase() || '-'} | 💾 ${b.filesize || '-'}\n` +
    `   ⭐ ${b.rating || '-'} | 🌐 ${b.language || '-'}`
  ).join('\n\n');
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const jid = m.sender;
  const args = (text || '').trim();

  if (!args) {
    throw `Gunakan:\n• \`${usedPrefix}${command} <judul buku>\` — cari buku\n• \`${usedPrefix}${command} dl <nomor>\` — download buku\n• \`${usedPrefix}${command} info <nomor>\` — detail buku`;
  }

  // .zlib dl <nomor>
  if (args.startsWith('dl ') || args.startsWith('download ')) {
    const num = parseInt(args.split(' ')[1]);
    const cache = searchCache.get(jid);

    if (!cache?.length) throw `❌ Belum ada hasil pencarian.\n\nCari dulu: \`${usedPrefix}${command} <judul>\``;
    if (isNaN(num) || num < 1 || num > cache.length) throw `❌ Nomor tidak valid. Pilih 1-${cache.length}.`;

    const book = cache[num - 1];
    if (!book.download) throw `❌ Link download tidak tersedia untuk buku ini.`;

    await conn.sendPresenceUpdate('composing', m.chat);
    await conn.reply(m.chat, `⏳ Mengunduh *${book.title}*...`, m);

    const result = await client.download(book.download);
    if (!result.success) throw `❌ Download gagal: ${result.error}`;

    const mimeMap = { epub: 'application/epub+zip', pdf: 'application/pdf', mobi: 'application/x-mobipocket-ebook', azw3: 'application/vnd.amazon.ebook', fb2: 'application/x-fictionbook+xml', djvu: 'image/vnd.djvu' };
    const ext = result.filename.split('.').pop().toLowerCase();
    const mimetype = mimeMap[ext] || 'application/octet-stream';
    await conn.sendMessage(m.chat, { document: result.buffer, mimetype, fileName: result.filename, caption: `📚 *${book.title}*\n👤 ${book.author}\n💾 ${(result.size / 1024 / 1024).toFixed(2)} MB` }, { quoted: m });
    return;
  }

  // .zlib info <nomor>
  if (args.startsWith('info ')) {
    const num = parseInt(args.split(' ')[1]);
    const cache = searchCache.get(jid);

    if (!cache?.length) throw `❌ Belum ada hasil pencarian.`;
    if (isNaN(num) || num < 1 || num > cache.length) throw `❌ Nomor tidak valid. Pilih 1-${cache.length}.`;

    const book = cache[num - 1];
    await conn.sendPresenceUpdate('composing', m.chat);

    const detail = await client.getBook(book.href);
    if (!detail.success) throw `❌ Gagal ambil detail: ${detail.error}`;

    const info = [
      `📚 *${detail.title}*`,
      `👤 *Author:* ${detail.author || '-'}`,
      ``,
      detail.description ? `📝 *Deskripsi:*\n${detail.description}` : '',
      ``,
      Object.entries(detail.details).slice(0, 8).map(([k, v]) => `• *${k}:* ${v}`).join('\n'),
    ].filter(Boolean).join('\n');

    return conn.reply(m.chat, info, m);
  }

  // .zlib <query> → search
  await conn.sendPresenceUpdate('composing', m.chat);

  const result = await client.search(args, 10);
  if (!result.success) throw `❌ Pencarian gagal: ${result.error}`;
  if (!result.books.length) throw `❌ Tidak ada hasil untuk: *${args}*`;

  searchCache.set(jid, result.books);

  // Auto-clear cache setelah 10 menit
  setTimeout(() => searchCache.delete(jid), 10 * 60 * 1000);

  const msg = [
    `📚 *Hasil pencarian: "${args}"*`,
    `Ditemukan ${result.total} buku\n`,
    formatBooks(result.books),
    `\n💡 Download: \`${usedPrefix}${command} dl <nomor>\``,
    `💡 Detail: \`${usedPrefix}${command} info <nomor>\``,
  ].join('\n');

  return conn.reply(m.chat, msg, m);
};

handler.help = ['zlib <judul>', 'zlib dl <nomor>', 'zlib info <nomor>'];
handler.tags = ['tools'];
handler.command = /^(zlib|ebook|book)$/i;

module.exports = handler;