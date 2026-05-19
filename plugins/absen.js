const { readFile, writeFile } = require('fs/promises')
const { resolve } = require('path')

const DB_PATH = resolve('memo/absen.json')
let sessionActive = false

// ── DB Helpers ───────────────────────────────────────────────
async function getAbsen(date) {
  try {
    const raw = await readFile(DB_PATH, 'utf-8')
    const db = JSON.parse(raw)
    return db[date] ?? {}
  } catch { return {} }
}

async function recordAbsen(phone, nama, jabatan) {
  const date = new Date().toLocaleDateString('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: 'Asia/Makassar'
  }).split('/').reverse().join('-')

  const today = await getAbsen(date)
  if (today[phone]) return { sudahAbsen: true, data: today[phone] }

  const waktu = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Makassar'
  })

  today[phone] = { nama, jabatan, waktu }

  let db = {}
  try { db = JSON.parse(await readFile(DB_PATH, 'utf-8')) } catch {}
  db[date] = today
  await writeFile(DB_PATH, JSON.stringify(db, null, 2))

  return { sudahAbsen: false, data: today[phone] }
}

// ── Helpers ──────────────────────────────────────────────────
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizePhone(raw) {
  return raw.replace(/\D/g, '').replace(/^0/, '')
}

// ── Plugin Export ────────────────────────────────────────────
const handler = async function (m, { conn, isAdmin, text: rawText }) {
  const text = rawText?.trim().toLowerCase() || ''

  if (!m.isGroup) return m.reply('⛔ Perintah ini hanya untuk grup.')
  if (!isAdmin) return m.reply('⛔ Hanya admin yang bisa menggunakan perintah ini.')

  if (text === 'mulai') {
    sessionActive = true
    return conn.reply(m.chat, '✅ Sesi absen dimulai. Silakan kirim lokasi untuk absen.', m)
  }

  if (text === 'stop') {
    sessionActive = false
    return conn.reply(m.chat, '🛑 Sesi absen ditutup.', m)
  }


  if (text === 'reset') {
    if (!sessionActive) return conn.reply(m.chat, '⚠️ Tidak ada sesi absen yang aktif.', m)

    const date = new Date().toLocaleDateString('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).split('/').reverse().join('-')

    let db = {}
    try { db = JSON.parse(await readFile(DB_PATH, 'utf-8')) } catch {}
    const total = Object.keys(db[date] || {}).length
    delete db[date]
    await writeFile(DB_PATH, JSON.stringify(db, null, 2))

    return conn.reply(m.chat, `🗑️ Data absen hari ini telah direset. (${total} record dihapus)`, m)
  }
  if (text === 'list') {
    if (!sessionActive) return conn.reply(m.chat, '⚠️ Tidak ada sesi absen yang aktif.', m)

    const date = new Date().toLocaleDateString('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: 'Asia/Makassar'
    }).split('/').reverse().join('-')

    const data = await getAbsen(date)
    const entries = Object.entries(data)

    if (!entries.length) return conn.reply(m.chat, '📋 Belum ada yang absen hari ini.', m)

    const list = entries
      .map(([, v], i) => `${i + 1}. *${v.nama}* — ${v.jabatan}\n    🕐 ${v.waktu}`)
      .join('\n\n')

    return conn.reply(m.chat, `📋 *Daftar Absen Hari Ini*\n\n${list}\n\n_Total: ${entries.length} orang_`, m)
  }
}

handler.command = /^absen$/i
handler.group = true

// ── Before: handle lokasi ────────────────────────────────────
handler.before = async function (m, { conn }) {
  if (!sessionActive) return false
  if (!m.isGroup) return false

  const isLiveLocation = m.message?.liveLocationMessage
  const isStaticLocation = m.message?.locationMessage
  if (isStaticLocation) {
    await conn.reply(m.chat, '⚠️ Gunakan *Lokasi Langsung (Live Location)* untuk absen, bukan lokasi biasa.', m)
    return true
  }
  if (!isLiveLocation) return false

  const loc = m.message.liveLocationMessage
  const { degreesLatitude: lat, degreesLongitude: lon } = loc

  const sender = m.sender || m.key?.participant
  const phone = normalizePhone(sender.split('@')[0])

  const { employees } = require('/home/container/memo/employees.js')
  const employee = employees.find(e => normalizePhone(e.phone) === phone)
  if (!employee) return false

  const jarak = hitungJarak(lat, lon, global.officeLocation.lat, global.officeLocation.lon)

  if (jarak > global.radiusLimit) {
    await conn.reply(m.chat, `❌ *${employee.nama}*, lokasi kamu terlalu jauh dari kantor (${Math.round(jarak)}m).`, m)
    return true
  }

  const { sudahAbsen, data } = await recordAbsen(phone, employee.nama, employee.jabatan)

  if (sudahAbsen) {
    await conn.reply(m.chat, `⚠️ *${employee.nama}*, kamu sudah absen hari ini pukul ${data.waktu}.`, m)
    return true
  }

  await conn.reply(m.chat, `✅ Absen berhasil!\n👤 *${data.nama}*\n💼 ${data.jabatan}\n🕐 ${data.waktu}`, m)
  return true
}

module.exports = handler