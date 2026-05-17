const { SciHubClient, isDOI, isURL } = require('../lib/scrape/scihub.js');

const client = new SciHubClient();
const searchCache = new Map();
const PAGE_SIZE = 10;

function formatResults(results, page) {
  const start = (page - 1) * PAGE_SIZE;
  const slice = results.slice(start, start + PAGE_SIZE);
  return slice.map(r =>
    `${r.index}. *${r.title}* [${r.author || 'Unknown'}|${r.year}]`
  ).join('\n');
}


const sanitizeFilename = (title, year) => {
  const base = (title || 'jurnal')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 60)
    .trim();
  return `${base}${year ? '-' + year : ''}.pdf`;
};
let handler = async (m, { conn, text, usedPrefix, command }) => {
  const jid = m.sender;
  const query = (text || '').trim();

  if (!query) {
    throw `Gunakan:\n• \`${usedPrefix}${command} <kata kunci>\` — cari jurnal\n• \`${usedPrefix}${command} <DOI>\` — fetch by DOI\n• \`${usedPrefix}${command} <URL>\` — fetch by link\n• \`${usedPrefix}${command} dl <nomor>\` — download hasil pencarian`;
  }

  if (query.startsWith('dl ')) {
    const num = parseInt(query.split(' ')[1]);
    const cache = searchCache.get(jid);

    if (!cache?.results?.length) throw `❌ Belum ada hasil pencarian.\n\nCari dulu: \`${usedPrefix}${command} <kata kunci>\``;
    if (isNaN(num) || num < 1 || num > cache.results.length) throw `❌ Nomor tidak valid. Pilih 1-${cache.results.length}.`;

    const paper = cache.results[num - 1];
    await conn.sendPresenceUpdate('composing', m.chat);
    await conn.reply(m.chat, `⏳ Mengunduh *${paper.title}*...`, m);

    let pdfUrl = paper.pdf;
    let title = paper.title;
    let author = paper.author;
    let result;

    if (pdfUrl) {
      result = await client.download(pdfUrl);
      if (!result.success && paper.doi) {
        const meta = await client.fetchBySciHub(paper.doi);
        if (meta.success) {
          result = await client.download(meta.pdfUrl);
          title = meta.title || title;
          author = meta.author || author;
        }
        if (!result.success && paper.doi) {
          const oa = await client.resolveOpenAccess(paper.doi);
          if (oa.success) {
            result = await client.download(oa.pdfUrl);
            title = oa.title || title;
            author = oa.author || author;
          }
        }
      }
    } else if (paper.doi) {
      const meta = await client.fetchBySciHub(paper.doi);
      if (meta.success) {
        result = await client.download(meta.pdfUrl);
        title = meta.title || title;
        author = meta.author || author;
      }
      if (!result?.success) {
        const oa = await client.resolveOpenAccess(paper.doi);
        if (oa.success) {
          result = await client.download(oa.pdfUrl);
          title = oa.title || title;
          author = oa.author || author;
        }
      }
    } else {
      throw `❌ PDF tidak tersedia untuk jurnal ini.`;
    }
    if (!result?.success) throw `Jurnal tidak tersedia untuk diunduh.`;

    if (!result.success) throw `❌ Download gagal: ${result.error}`;

    await conn.sendMessage(m.chat, {
      document: result.buffer,
      mimetype: 'application/pdf',
      fileName: sanitizeFilename(title, paper.year),
      caption: [
        `📄 *${title}*`,
        author ? `👤 ${author}` : '',
        `💾 ${(result.size / 1024 / 1024).toFixed(2)} MB`,
      ].filter(Boolean).join('\n'),
    }, { quoted: m });
    return;
  }

  if (isDOI(query) || isURL(query)) {
    await conn.sendPresenceUpdate('composing', m.chat);
    await conn.reply(m.chat, `⏳ Mengambil jurnal...`, m);

    let directResult, directTitle, directAuthor;

    const meta = await client.fetchBySciHub(query);
    if (meta.success) {
      directResult = await client.download(meta.pdfUrl);
      directTitle = meta.title;
      directAuthor = meta.author;
    }

    if (!directResult?.success && isDOI(query)) {
      const oa = await client.resolveOpenAccess(query);
      if (oa.success) {
        directResult = await client.download(oa.pdfUrl);
        directTitle = directTitle || oa.title;
        directAuthor = directAuthor || oa.author;
      }
    }

    if (!directResult?.success) throw `Jurnal tidak tersedia untuk diunduh.`;

    await conn.sendMessage(m.chat, {
      document: directResult.buffer,
      mimetype: 'application/pdf',
      fileName: sanitizeFilename(directTitle || query, null),
      caption: [
        `📄 *${directTitle || query}*`,
        directAuthor ? `👤 ${directAuthor}` : '',
        `💾 ${(directResult.size / 1024 / 1024).toFixed(2)} MB`,
      ].filter(Boolean).join('\n'),
    }, { quoted: m });
    return;
  }

  if (/^p\d+$/.test(query)) {
    const page = parseInt(query.slice(1));
    const cache = searchCache.get(jid);
    if (!cache?.results?.length) throw `❌ Belum ada hasil pencarian.`;
    const totalPages = Math.ceil(cache.results.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) throw `❌ Halaman tidak valid. Tersedia 1-${totalPages}.`;
    cache.currentPage = page;
    const msg = [
      `📚 *${cache.query}* — Halaman ${page}/${totalPages}`,
      formatResults(cache.results, page),
      `Download: \`${usedPrefix}${command} dl <nomor>\``,
      `Halaman lain: \`${usedPrefix}${command} p<angka>\``,
    ].join('\n');
    return conn.reply(m.chat, msg, m);
  }

  await conn.sendPresenceUpdate('composing', m.chat);

  const result = await client.searchOpenAlex(query, 50);
  if (!result.success) throw `❌ Pencarian gagal: ${result.error}`;
  if (!result.results.length) throw `❌ Tidak ada hasil untuk: *${query}*`;

  searchCache.set(jid, { query, results: result.results, currentPage: 1, usedPrefix, command });
  setTimeout(() => searchCache.delete(jid), 10 * 60 * 1000);

  const totalPages = Math.ceil(result.results.length / PAGE_SIZE);
  const navHint = totalPages > 1 ? `Balas/reply dengan *next* untuk halaman selanjutnya` : '';
  const msg = [
    `📚 *Hasil pencarian: "${query}"*`,
    `Ditemukan ${result.total.toLocaleString()} jurnal — Halaman 1/${totalPages}`,
    '',
    formatResults(result.results, 1),
    `\nDownload: \`${usedPrefix}${command} dl <nomor>\``,
    navHint,
  ].filter(Boolean).join('\n');

  return conn.reply(m.chat, msg, m);
};

handler.before = async function(m, { conn }) {
  const query = m.text?.trim().toLowerCase();
  if (query !== 'next' && query !== 'prev') return false;
  if (!m.quoted?.fromMe) return false;
  if (!m.quoted.text?.includes('📚')) return false;

  const jid = m.sender;
  const cache = searchCache.get(jid);
  if (!cache?.results?.length) return false;

  const totalPages = Math.ceil(cache.results.length / PAGE_SIZE);
  let page = cache.currentPage || 1;
  if (query === 'next') {
    if (page >= totalPages) { await conn.reply(m.chat, `Kamu sudah berada di halaman terakhir (${totalPages}/${totalPages}).
Coba cari dengan kata kunci yang lebih spesifik untuk hasil yang lebih relevan.`, m); return true; }
    page++;
  } else {
    if (page <= 1) { await conn.reply(m.chat, `❌ Sudah di halaman pertama.`, m); return true; }
    page--;
  }
  cache.currentPage = page;

  const isLast = page >= totalPages;
  const navMsg = isLast
    ? `Kamu sudah berada di halaman terakhir (${totalPages}/${totalPages}).\nCoba cari dengan kata kunci yang lebih spesifik untuk hasil yang lebih relevan.`
    : page === 1
      ? `Balas/reply dengan *next* untuk halaman selanjutnya`
      : `Balas/reply dengan *next* untuk halaman selanjutnya, *prev* untuk halaman sebelumnya`;
  const dlHint = `Download: \`${cache.usedPrefix || '.'}${cache.command || 'scihub'} dl <nomor>\``;
  const msg = [
    `📚 *${cache.query}* — Halaman ${page}/${totalPages}`,
    formatResults(cache.results, page),
    '',
    dlHint,
    navMsg,
  ].join('\n');

  await conn.reply(m.chat, msg, m);
  return true;
};

handler.help = ['scihub <kata kunci>', 'scihub <DOI>', 'scihub dl <nomor>'];
handler.tags = ['tools'];
handler.command = /^(scihub|jurnal|doi)$/i;

module.exports = handler;
