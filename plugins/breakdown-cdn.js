let handler = async (m, { args, usedPrefix, command }) => {
    let url = args[0]
    if (!url) return m.reply(`*Format:* ${usedPrefix + command} <url>`)

    try {
        let parsed = new URL(url)

        // Ekstrak komponen
        let host = parsed.hostname
        let path = parsed.pathname
        let params = Object.fromEntries(parsed.searchParams)

        // Decode expiry
        let expiry = params.oe ? new Date(parseInt(params.oe, 16) * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'N/A'

        // Deteksi tipe media dari path
        let mediaType = 'Unknown'
        let pathMatch = path.match(/\/(t\d+\.\d+-\d+)\//)
        if (pathMatch) {
            let code = pathMatch[1]
            const typeMap = {
                't62.7118-24': 'Encrypted Media Stream',
                't62.7115-24': 'Encrypted Image',
                't62.7116-24': 'Encrypted Video',
                't62.7117-24': 'Encrypted Audio',
                't62.36145-24': 'Encrypted Document',
            }
            mediaType = typeMap[code] || `Unknown (${code})`
        }

        // Deteksi platform CDN
        let platform = 'Unknown'
        if (host.includes('whatsapp.net')) platform = 'WhatsApp (Meta CDN)'
        else if (host.includes('fbcdn.net')) platform = 'Facebook CDN'
        else if (host.includes('cdninstagram.com')) platform = 'Instagram CDN'

        // Cek apakah expired
        let isExpired = params.oe ? Date.now() > parseInt(params.oe, 16) * 1000 : null

        let result = `🔍 *CDN URL BREAKDOWN*\n\n` +
            `🌐 *Host:* ${host}\n` +
            `📦 *Platform:* ${platform}\n` +
            `🎞️ *Tipe Media:* ${mediaType}\n` +
            `📁 *Path:* ${path}\n\n` +
            `⚙️ *PARAMETERS*\n` +
            (params.ccb ? `> *CCB (Cipher Block):* ${params.ccb}\n` : '') +
            (params.oh  ? `> *OH (Auth Token):* ${params.oh.substring(0, 20)}...\n` : '') +
            (params.oe  ? `> *OE (Expiry):* ${expiry} WIB\n` : '') +
            (params._nc_sid ? `> *NC SID (Session):* ${params._nc_sid}\n` : '') +
            `\n${isExpired === true ? '🔴 *Status: URL sudah EXPIRED*' : isExpired === false ? '🟢 *Status: URL masih AKTIF*' : '⚪ *Status: Tidak diketahui*'}`

        m.reply(result)

    } catch (e) {
        m.reply('❌ URL tidak valid atau tidak dapat diparse.')
    }
}

handler.help = ['cdncheck <url>']
handler.tags = ['owner']
handler.command = /^(cdncheck|cdninfo|breakdown)$/i
handler.owner = true

module.exports = handler