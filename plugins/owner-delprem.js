const { loadBaileys } = require('../baileys-loader.mjs');

let baileys;

let handler = async (m, { conn, text, usedPrefix }) => {
    if (!baileys) {
    baileys = await loadBaileys();
  }

  const { MessageType } = baileys;
  
  if (!text && !m.mentionedJid[0]) {
    return conn.reply(m.chat, `*『 G A G A L 』*\n\n${usedPrefix}unprem @tag/nomor\n\n*Example:* ${usedPrefix}unprem 6285764068784`, m);
  }

  // Mengambil target dari tag atau input nomor manual
  let who;
  if (m.mentionedJid[0]) {
      who = m.mentionedJid[0];
  } else {
      who = text.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  }

  let users = global.db.data.users;
  
  // FIX: Cegah Error TypeError dengan memastikan user ada di database
  if (!users[who]) {
      users[who] = {
          premium: false,
          premiumTime: 0
      };
  }

  users[who].premium = false;
  users[who].premiumTime = 0;
  
  conn.reply(m.chat, `*Berhasil menghapus akses premium untuk @${who.split('@')[0]}.*`, m, { 
      contextInfo: { 
          mentionedJid: [who] 
      } 
  });
};

handler.help = ['unprem'];
handler.tags = ['owner'];
handler.command = /^(unprem|delprem)$/i;
handler.owner = true;
handler.fail = null;

module.exports = handler;