let handler = async (m, { conn }) => {
  const uptime = process.uptime()

  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)

  const msgContent = {
    pollResultSnapshotMessage: {
      name: '```RUNTIME```',
      pollVotes: [
        { optionName: 'Day', optionVoteCount: String(days) },
        { optionName: 'Hour', optionVoteCount: String(hours) },
        { optionName: 'Minute', optionVoteCount: String(minutes) },
        { optionName: 'Second', optionVoteCount: String(seconds) }
      ],
      contextInfo: {
        forwardingScore: 1,
        isForwarded: false,
        forwardOrigin: 'UNKNOWN'
      },
      pollType: 'POLL'
    }
  }

  const { generateMessageID } = require('@whiskeysockets/baileys')
  await conn.relayMessage(m.chat, msgContent, { messageId: generateMessageID() })
}

handler.help = ['runtime']
handler.tags = ['info']
handler.command = /^(runtime|uptime)$/i

module.exports = handler