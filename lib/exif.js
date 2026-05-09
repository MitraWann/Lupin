const fs     = require('fs')
const { tmpdir } = require('os')
const Crypto = require('crypto')
const ff     = require('fluent-ffmpeg')
const webp   = require('node-webpmux')
const path   = require('path')

// ── Helper: nama file tmp acak ────────────────────────────────
const tmpName = (ext) => path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`)

// ── imageToWebp ───────────────────────────────────────────────
async function imageToWebp(media) {
    const tmpFileIn  = tmpName('jpg')
    const tmpFileOut = tmpName('webp')

    fs.writeFileSync(tmpFileIn, media)

    // [FIX] Bungkus dengan try/finally agar file tmp selalu dibersihkan
    // meskipun ffmpeg throw error di tengah proses (storage leak)
    try {
        await new Promise((resolve, reject) => {
            ff(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf',
                    // [FIX] Typo filter: min'(320,ih)' → 'min(320,ih)'
                    "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
                ])
                .toFormat('webp')
                .save(tmpFileOut)
        })

        const buff = fs.readFileSync(tmpFileOut)
        return buff
    } finally {
        // [FIX] Selalu hapus tmp — baik sukses maupun error
        if (fs.existsSync(tmpFileIn))  fs.unlinkSync(tmpFileIn)
        if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut)
    }
}

// ── videoToWebp ───────────────────────────────────────────────
async function videoToWebp(media) {
    const tmpFileIn  = tmpName('mp4')
    const tmpFileOut = tmpName('webp')

    fs.writeFileSync(tmpFileIn, media)

    try {
        await new Promise((resolve, reject) => {
            ff(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf',
                    // [FIX] Typo filter: min'(320,ih)' → 'min(320,ih)'
                    "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                    '-loop', '0',
                    '-ss', '00:00:00',
                    '-t', '00:00:06',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0'
                ])
                .toFormat('webp')
                .save(tmpFileOut)
        })

        const buff = fs.readFileSync(tmpFileOut)
        return buff
    } finally {
        if (fs.existsSync(tmpFileIn))  fs.unlinkSync(tmpFileIn)
        if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut)
    }
}

// ── writeExifImg ──────────────────────────────────────────────
async function writeExifImg(media, metadata) {
    let wMedia = await imageToWebp(media)

    const tmpFileIn  = tmpName('webp')
    const tmpFileOut = tmpName('webp')

    fs.writeFileSync(tmpFileIn, wMedia)

    // [FIX] Jika packname & author keduanya falsy, kembalikan webp tanpa exif
    // daripada return undefined yang menyebabkan crash di caller (simple.js)
    if (!metadata.packname && !metadata.author) {
        if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn)
        return wMedia
    }

    try {
        const img      = new webp.Image()
        const json     = {
            'sticker-pack-id':        'https://github.com/BOTCAHX/RTXZY-MD',
            'sticker-pack-name':      metadata.packname || '',
            'sticker-pack-publisher': metadata.author   || '',
            'emojis':                 metadata.categories || ['']
        }
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ])
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
        const exif     = Buffer.concat([exifAttr, jsonBuff])
        exif.writeUIntLE(jsonBuff.length, 14, 4)

        await img.load(tmpFileIn)
        img.exif = exif
        await img.save(tmpFileOut)

        // Baca output sebelum dikembalikan
        const result = fs.readFileSync(tmpFileOut)
        return result
    } finally {
        // [FIX] Selalu bersihkan tmp — termasuk saat error
        if (fs.existsSync(tmpFileIn))  fs.unlinkSync(tmpFileIn)
        if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut)
    }
}

// ── writeExifVid ──────────────────────────────────────────────
async function writeExifVid(media, metadata) {
    let wMedia = await videoToWebp(media)

    const tmpFileIn  = tmpName('webp')
    const tmpFileOut = tmpName('webp')

    fs.writeFileSync(tmpFileIn, wMedia)

    if (!metadata.packname && !metadata.author) {
        if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn)
        return wMedia
    }

    try {
        const img      = new webp.Image()
        const json     = {
            'sticker-pack-id':        'https://github.com/BOTCAHX/RTXZY-MD',
            'sticker-pack-name':      metadata.packname || '',
            'sticker-pack-publisher': metadata.author   || '',
            'emojis':                 metadata.categories || ['']
        }
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ])
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
        const exif     = Buffer.concat([exifAttr, jsonBuff])
        exif.writeUIntLE(jsonBuff.length, 14, 4)

        await img.load(tmpFileIn)
        img.exif = exif
        await img.save(tmpFileOut)

        const result = fs.readFileSync(tmpFileOut)
        return result
    } finally {
        if (fs.existsSync(tmpFileIn))  fs.unlinkSync(tmpFileIn)
        if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut)
    }
}

module.exports = { imageToWebp, videoToWebp, writeExifImg, writeExifVid }
