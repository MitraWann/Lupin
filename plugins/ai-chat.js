const { ask, MODELS } = require('../lib/scrape/ai-router.js');
const {
  getSelectedModel,
  setModel,
  initModelIfNeeded,
  clearSession,
  resetModelSession,
} = require('../lib/db/ai-session.js');

const MODEL_LIST = Object.values(MODELS)
  .map((m) => `• *${m.label}* → \`${m.key}\`${m.needsSession ? ' _(session)_' : ''}`)
  .join('\n');

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const jid = m.sender;
  const args = (text || '').trim();

  if (args === 'model') {
    const current = getSelectedModel(jid);
    const currentLabel = current ? MODELS[current]?.label : 'Belum dipilih';
    return conn.reply(
      m.chat,
      `🤖 *Model aktif:* ${currentLabel}\n\n*Model tersedia:*\n${MODEL_LIST}\n\nGanti: \`${usedPrefix}${command} model <key>\``,
      m
    );
  }

  if (args.startsWith('model ')) {
    const key = args.slice(6).trim().toLowerCase();
    if (!MODELS[key]) {
      throw `❌ Model *${key}* tidak ditemukan.\n\nModel valid: ${Object.keys(MODELS).join(', ')}`;
    }
    await setModel(jid, key);
    return conn.reply(m.chat, `✅ Model diganti ke *${MODELS[key].label}*\n\nMulai chat: \`${usedPrefix}${command} <pesan>\``, m);
  }

  if (args === 'reset') {
    const modelKey = getSelectedModel(jid);
    if (!modelKey) throw `❌ Belum ada model yang dipilih.`;
    await resetModelSession(jid, modelKey);
    return conn.reply(m.chat, `♻️ Session *${MODELS[modelKey].label}* direset.`, m);
  }

  if (args === 'resetall') {
    await clearSession(jid);
    return conn.reply(m.chat, `♻️ Semua session dihapus.`, m);
  }

  if (!args) {
    throw `Harap masukkan pesan atau perintah!\n\n*Perintah:*\n• \`${usedPrefix}${command} <pesan>\` — chat\n• \`${usedPrefix}${command} model\` — lihat model\n• \`${usedPrefix}${command} model <key>\` — ganti model\n• \`${usedPrefix}${command} reset\` — reset session\n• \`${usedPrefix}${command} resetall\` — reset semua\n\n*Model tersedia:*\n${MODEL_LIST}`;
  }

  const modelKey = getSelectedModel(jid);
  if (!modelKey) {
    throw `⚠️ Pilih model dulu!\n\nGunakan: \`${usedPrefix}${command} model <key>\`\n\n*Model tersedia:*\n${MODEL_LIST}`;
  }

  const sessionData = await initModelIfNeeded(jid, modelKey);
  await conn.sendPresenceUpdate('composing', m.chat);

  const result = await ask(args, modelKey, sessionData);
  if (!result.success) throw `❌ Gagal: ${result.error}`;

  return conn.reply(m.chat, result.answer, m);
};

handler.help = ['ai <pesan>', 'ai model', 'ai model <key>', 'ai reset', 'ai resetall'];
handler.tags = ['ai'];
handler.command = /^(ai)$/i;

module.exports = handler;