const fs   = require('fs')
const path = require('path')
const { spawn } = require('child_process')

// [FIX] Pastikan folder tmp ada sebelum dipakai
// Tidak bisa diasumsikan selalu ada hanya karena index.js membuatnya,
// karena converter.js bisa dipanggil dari entry point manapun
const tmpDir = path.join(__dirname, '../tmp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    // [FIX] Hindari new Promise(async) anti-pattern
    // Semua async logic dipindahkan ke luar constructor Promise
    // dengan wrapper async function yang di-resolve/reject secara eksplisit
    return new Promise((resolve, reject) => {
        const tmp = path.join(tmpDir, Date.now() + '.' + ext)
        const out = tmp + '.' + ext2

        // Tulis file input dulu, baru spawn ffmpeg
        fs.promises.writeFile(tmp, buffer)
            .then(() => {
                const proc = spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])

                proc.on('error', async (err) => {
                    // Bersihkan tmp jika spawn gagal
                    if (fs.existsSync(tmp)) await fs.promises.unlink(tmp).catch(() => {})
                    reject(err)
                })

                proc.on('close', async (code) => {
                    // Selalu hapus file input setelah ffmpeg selesai
                    if (fs.existsSync(tmp)) {
                        await fs.promises.unlink(tmp).catch(() => {})
                    }

                    if (code !== 0) {
                        // Bersihkan output yang mungkin tidak sempurna
                        if (fs.existsSync(out)) await fs.promises.unlink(out).catch(() => {})
                        return reject(new Error(`ffmpeg exited with code ${code}`))
                    }

                    try {
                        const audioBuffer = await fs.promises.readFile(out)

                        // [FIX] File output dihapus SETELAH dibaca ke buffer
                        // lalu resolve dengan data buffer saja — bukan filename
                        // karena filename sudah tidak exist setelah dihapus
                        // Caller di simple.js hanya butuh .data, bukan .filename sebagai path file
                        if (fs.existsSync(out)) await fs.promises.unlink(out).catch(() => {})

                        // [FIX] filename di resolve hanya sebagai metadata informatif,
                        // bukan path yang bisa diakses — tandai dengan flag 'deleted: true'
                        resolve({ data: audioBuffer, filename: out, deleted: true })
                    } catch (e) {
                        if (fs.existsSync(out)) await fs.promises.unlink(out).catch(() => {})
                        reject(e)
                    }
                })
            })
            .catch(reject)
    })
}

/**
 * Convert Audio to Playable WhatsApp Voice Note (PTT)
 * Standar WA: Codec Opus, Format OGG, 48kHz, Mono
 */
function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-ar', '48000',
        '-ac', '1'
    ], ext, 'ogg')
}

/**
 * Convert Video/Audio to MP3
 */
function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
        '-q:a', '2'
    ], ext, 'mp3')
}

/**
 * Convert Video to WhatsApp-compatible MP4
 */
function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ab',  '128k',
        '-ar',  '44100',
        '-crf', '32',
        '-preset', 'slow'
    ], ext, 'mp4')
}

module.exports = { toAudio, toPTT, toVideo, ffmpeg }
