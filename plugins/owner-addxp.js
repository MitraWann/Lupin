const { loadBaileys } = require('../baileys-loader.mjs');

let baileys;

let handler = async (m, { conn, text }) => {
  if (!baileys) {
    baileys = await loadBaileys();
  }

  const { MessageType } = baileys;
  
  if (!text) {
    throw 'Masukkan jumlah xp yang ingin ditambahkan pada pengguna. Contoh: .addxp @user 10';
  }
    
  // conn.chatRead(m.chat) <- Dihapus agar tidak menyebabkan TypeError crash
  
  conn.sendMessage(m.chat, {
      react: {
          text: '🕒',
          key: m.key,
      }
  })

  let mentionedJid = m.mentionedJid[0];
  if (!mentionedJid) {
    throw 'Tag pengguna yang ingin ditambahkan xpnya Contoh: .addxp @user 10';
  }

  let pointsToAdd = parseInt(text.split(' ')[1]);
  if (isNaN(pointsToAdd)) {
    throw 'Jumlah xp yang dimasukkan harus berupa angka. Contoh: .addxp @user 10';
  }

  let users = global.db.data.users;
  if (!users[mentionedJid]) {
    users[mentionedJid] = {
      exp: 0,
      lastclaim: 0
    };
  }

  users[mentionedJid].exp += pointsToAdd;

  // Menggunakan contextInfo agar tag menjadi warna biru (clickable)
  conn.reply(m.chat, `Berhasil menambahkan ${pointsToAdd} exp untuk @${mentionedJid.split('@')[0]}.`, m, {
    contextInfo: {
        mentionedJid: [mentionedJid]
    }
  });
};

handler.help = ['addxp @user <jumlah>'];
handler.tags = ['xp'];
handler.command = /^addxp$/i;
handler.owner = true;

module.exports = handler;