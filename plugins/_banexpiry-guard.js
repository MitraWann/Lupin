let handler = m => m

handler.before = async function (m) {
    if (m.isBaileys || m.fromMe) return

    let users = global.db.data.users
    let user = users[m.sender]
    if (!user) return

    if (user.banned && user.bannedTime > 0 && Date.now() >= user.bannedTime) {
        user.banned = false
        user.bannedTime = 0
    }
}

module.exports = handler