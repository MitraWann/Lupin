const { analyzeWebsite } = require('../lib/scrape/web-analyzer.js');

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Masukkan URL!\n\nContoh: ${usedPrefix}${command} https://example.com`;

  let url = text.trim();
  if (!url.startsWith('http')) url = 'https://' + url;

  try { new URL(url); } catch { throw `❌ URL tidak valid: ${url}`; }

  await conn.sendPresenceUpdate('composing', m.chat);
  await conn.reply(m.chat, `🔍 Menganalisis *${url}*...\nMohon tunggu.`, m);

  const r = await analyzeWebsite(url);

  if (!r.success) throw `❌ Analisis gagal: ${r.error}`;

  const lines = [];

  lines.push(`📊 *Web Analyzer Report*`);
  lines.push(`🔗 ${r.url}`);
  lines.push(`📡 HTTP Status: ${r.httpStatus}`);
  lines.push('');

  lines.push(`🧱 *Tech Stack*`);
  lines.push(r.stack.map(s => `  • ${s}`).join('\n'));
  lines.push(`🖥️ Render: ${r.renderType}`);
  lines.push('');

  lines.push(`🤖 *Robots.txt*`);
  lines.push(`  • Scraping: ${r.robots.allowed === null ? 'Tidak ada robots.txt' : r.robots.allowed ? '✅ Diizinkan' : '❌ Dilarang'}`);
  if (r.robots.sitemaps?.length) {
    lines.push(`  • Sitemap: ${r.robots.sitemaps[0]}`);
  }
  lines.push('');

  lines.push(`🔌 *API Endpoints*`);
  if (r.apis.accessible.length) {
    lines.push(`  Accessible:\n${r.apis.accessible.map(e => `  • ${e}`).join('\n')}`);
  } else {
    lines.push(`  • Tidak ada endpoint publik ditemukan`);
  }
  if (r.apis.fromHTML.length) {
    lines.push(`  Dari HTML:\n${r.apis.fromHTML.slice(0, 5).map(e => `  • ${e}`).join('\n')}`);
  }
  if (r.apis.hasGraphQL) lines.push(`  • ✅ GraphQL tersedia`);
  lines.push('');

  if (r.bundles.endpoints.length) {
    lines.push(`📦 *JS Bundle Findings*`);
    lines.push(r.bundles.endpoints.slice(0, 5).map(e => `  • ${e}`).join('\n'));
    if (r.bundles.envVars.length) lines.push(`  Env vars: ${r.bundles.envVars.slice(0, 5).join(', ')}`);
    if (r.bundles.apiKeys.length) lines.push(`  API Keys: ${r.bundles.apiKeys.join(', ')}`);
    lines.push('');
  }

  lines.push(`🛡️ *Proteksi*`);
  if (r.protection.issues.length) {
    lines.push(r.protection.issues.map(i => `  • ⚠️ ${i}`).join('\n'));
  } else {
    lines.push(`  • ✅ Tidak ada proteksi terdeteksi`);
  }
  if (r.protection.cors) lines.push(`  • CORS: ${r.protection.cors}`);
  lines.push('');

  lines.push(`📈 *Scrapeability*`);
  lines.push(`  Score: ${r.scrapability.score}/100 — ${r.scrapability.verdict}`);
  if (r.scrapability.reasons.length) {
    lines.push(r.scrapability.reasons.map(re => `  • ${re}`).join('\n'));
  }
  lines.push('');

  lines.push(`💡 *Alternatif Scraping*`);
  lines.push(r.alternatives.map(a => `  • ${a}`).join('\n'));

  return conn.reply(m.chat, lines.join('\n'), m);
};

handler.help = ['analyze <url>'];
handler.tags = ['tools'];
handler.command = /^(analyze|webanalyze|wa)$/i;

module.exports = handler;