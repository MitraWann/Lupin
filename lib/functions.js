const fetch  = require('node-fetch')
const axios  = require('axios')
const cfonts = require('cfonts')
const spin   = require('spinnies')
const Crypto = require('crypto')

// ── [FIX #1] getBuffer dipindahkan ke ATAS sebelum searchAnime ───────────────
// const/let tidak di-hoist — memanggil getBuffer sebelum deklarasinya
// menghasilkan ReferenceError: Cannot access 'getBuffer' before initialization

// [FIX #7] Hapus `options ? options : {}` yang tidak berguna —
// gunakan default parameter `options = {}` agar axios tidak crash jika undefined
const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.log(`Error : ${e}`)
    }
}

// ── [FIX #4] Rename 'wait' → 'searchAnime' ───────────────────────────────────
// Nama 'wait' bentrok dengan global.wait dari config.js (string loading).
// Plugin yang menulis `const { wait } = require('./lib/functions')` akan mendapat
// fungsi ini, bukan string global — menyebabkan perilaku tak terduga.
//
// [FIX #5] Hilangkan new Promise(async (resolve, reject)) anti-pattern —
// refactor menjadi async function biasa dengan try/catch + throw
const searchAnime = async (media) => {
    const attachmentData = `data:image/jpeg;base64,${media.toString('base64')}`

    const response = await fetch('https://trace.moe/api/search', {
        method: 'POST',
        body: JSON.stringify({ image: attachmentData }),
        headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) throw new Error('Gambar tidak ditemukan!')

    const result = await response.json()

    // [FIX #6] Guard docs[0] — jika API return docs kosong, lempar error deskriptif
    // daripada crash dengan "Cannot destructure property of undefined"
    if (!result.docs || !result.docs[0]) {
        throw new Error('Saya tidak tau ini anime apa')
    }

    try {
        const {
            is_adult, title, title_chinese, title_romaji, title_english,
            episode, season, similarity, filename, at, tokenthumb, anilist_id
        } = result.docs[0]

        const belief = similarity < 0.89 ? 'Saya memiliki keyakinan rendah dalam hal ini : ' : ''
        const ecch   = is_adult ? 'Iya' : 'Tidak'

        return {
            video: await getBuffer(
                `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`
            ),
            teks: `${belief}
~> Ecchi : *${ecch}*
~> Judul Jepang : *${title}*
~> Ejaan Judul : *${title_romaji}*
~> Judul Inggris : *${title_english}*
~> Episode : *${episode}*
~> Season  : *${season}*`
        }
    } catch (e) {
        console.log(e)
        throw new Error('Saya tidak tau ini anime apa')
    }
}

const simih = async (text) => {
    try {
        const sami = await fetch(`https://simsumi.herokuapp.com/api?text=${text}`, { method: 'GET' })
        const res  = await sami.json()
        return res.success
    } catch {
        return 'Simi ga tau apa yang anda ngomong, bahasa alien yah kak?'
    }
}

const h2k = (number) => {
    const SI_POSTFIXES = ['', ' K', ' M', ' G', ' T', ' P', ' E']
    const tier = Math.log10(Math.abs(number)) / 3 | 0
    if (tier === 0) return number
    const postfix   = SI_POSTFIXES[tier]
    const scale     = Math.pow(10, tier * 3)
    const scaled    = number / scale
    let   formatted = scaled.toFixed(1) + ''
    if (/\.0$/.test(formatted)) formatted = formatted.substr(0, formatted.length - 2)
    return formatted + postfix
}

const randomBytes = (length) => {
    return Crypto.randomBytes(length)
}

const generateMessageID = () => {
    return randomBytes(10).toString('hex').toUpperCase()
}

const getGroupAdmins = (participants) => {
    // [FIX #2] Tambahkan const — tanpanya 'admins' menjadi variabel global implisit
    const admins = []
    for (let i of participants) {
        i.isAdmin ? admins.push(i.jid) : ''
    }
    return admins
}

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

const spinner = {
    interval: 120,
    frames: [
        '🕐', '🕑', '🕒', '🕓', '🕔', '🕕',
        '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'
    ]
}

let globalSpinner

const getGlobalSpinner = (disableSpins = false) => {
    if (!globalSpinner) globalSpinner = new spin({ color: 'blue', succeedColor: 'green', spinner, disableSpins })
    return globalSpinner
}

// [FIX #3] Tambahkan const — tanpanya 'spins' menjadi variabel global implisit
const spins = getGlobalSpinner(false)

const start = (id, text) => {
    spins.add(id, { text })
}

const info = (id, text) => {
    spins.update(id, { text })
}

const success = (id, text) => {
    spins.succeed(id, { text })
}

const close = (id, text) => {
    spins.fail(id, { text })
}

const banner = cfonts.render('LOADING...', {
    font:       'chrome',
    color:      'candy',
    align:      'center',
    gradient:   ['red', 'yellow'],
    lineHeight: 3
})

// [FIX #4] Export dengan nama baru 'searchAnime', bukan 'wait'
// Tambahkan alias 'wait' untuk backward-compat plugin lama yang masih pakai nama lama
module.exports = {
    searchAnime,
    wait: searchAnime,   // alias backward-compat — hapus setelah semua plugin diupdate
    simih,
    getBuffer,
    h2k,
    generateMessageID,
    getGroupAdmins,
    getRandom,
    start,
    info,
    success,
    banner,
    close,
    pickRandom
}
