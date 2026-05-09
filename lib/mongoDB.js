const mongoose = require('mongoose')
const { Schema } = mongoose

/**
 * mongoDB.js — Alternatif backend database berbasis MongoDB
 * Interface identik dengan database.js agar swap tinggal ganti constructor.
 *
 * Cara pakai di main.js:
 *   const dbUrl = process.env.MONGODB_URL
 *   global.db = dbUrl
 *       ? new (require('./lib/mongoDB'))(dbUrl)
 *       : new (require('./lib/database'))('database.json')
 *   await global.db.read()
 *
 * Fixed:
 *  #1 - findById() pakai callback API yang dihapus di Mongoose 7+ → async/await
 *  #2 - write() fire-and-forget, Promise tidak di-resolve dengan benar → return await
 *  #3 - options default useNewUrlParser/useUnifiedTopology deprecated Mongoose 6+ → hapus
 *  #4 - tidak ada reconnect handler → tambahkan event listener + reconnect otomatis
 */

// Skema tunggal: seluruh data bot disimpan dalam satu dokumen { data: {...} }
const dataSchema = new Schema({
    data: {
        type:     Object,
        required: true,
        default:  {}
    }
}, {
    // [FIX #1 pendukung] Aktifkan strict: false agar field nested tidak diblokir
    // saat struktur data bot berkembang tanpa update skema
    strict: false
})

module.exports = class mongoDB {
    /**
     * @param {String} url      MongoDB connection string (dari process.env.MONGODB_URL)
     * @param {Object} options  Mongoose connect options tambahan (opsional)
     */
    constructor(url, options = {}) {
        // [FIX #3] Hapus useNewUrlParser & useUnifiedTopology — deprecated Mongoose 6+,
        // menyebabkan DeprecationWarning dan diabaikan di Mongoose 7+
        this.url     = url
        this.options = options
        this.data    = {}
        this._data   = null   // dokumen Mongoose aktif
        this._model  = null   // Mongoose model
    }

    /**
     * Koneksi ke MongoDB, load data awal.
     * Dipanggil sekali saat bot start: await global.db.read()
     */
    async read() {
        // [FIX #4] Daftarkan event listener SEBELUM connect
        // agar tidak ada event yang terlewat di window singkat antara connect dan listener
        this._registerEvents()

        await mongoose.connect(this.url, this.options)

        // Gunakan model yang sudah ada jika hot-reload memanggil read() ulang
        this._model = mongoose.models['data'] || mongoose.model('data', dataSchema)

        // Load dokumen tunggal — buat jika belum ada
        this._data = await this._model.findOne({}).lean()
        if (!this._data) {
            const doc = await new this._model({ data: {} }).save()
            this._data = doc.toObject()
        }

        this.data = this._data.data || {}
        return this.data
    }

    /**
     * Simpan data ke MongoDB.
     * Interface identik dengan database.js: dipanggil setiap set data.
     * @param {Object} data
     */
    async write(data) {
        if (data == null) return data
        if (!this._model)  throw new Error('[mongoDB] write() dipanggil sebelum read()')

        // [FIX #1 & #2] Ganti callback API (dihapus Mongoose 7+) ke async/await.
        // Sebelumnya: this._model.findById(id, (err, docs) => { docs.save() })
        // → fire-and-forget, caller tidak bisa tahu kapan selesai, data bisa hilang.
        if (this._data?._id) {
            await this._model.findByIdAndUpdate(
                this._data._id,
                { $set: { data } },
                { new: true, upsert: true }
            )
        } else {
            const doc = await new this._model({ data }).save()
            this._data = doc.toObject()
        }

        this.data = data
        return this.data
    }

    /**
     * [FIX #4] Event listener untuk koneksi MongoDB.
     * Reconnect otomatis jika koneksi putus di tengah bot berjalan.
     * Dipanggil sekali dari read() — guard _eventsRegistered mencegah duplikasi
     * jika read() dipanggil ulang saat hot-reload.
     */
    _registerEvents() {
        if (this._eventsRegistered) return
        this._eventsRegistered = true

        mongoose.connection.on('connected', () => {
            console.log('[mongoDB] Terhubung ke MongoDB')
        })

        mongoose.connection.on('disconnected', () => {
            console.warn('[mongoDB] Koneksi terputus — mencoba reconnect...')
            // Mongoose 6+ punya serverSelectionTimeoutMS & auto-reconnect bawaan,
            // tapi kita tambahkan retry manual sebagai safety net
            setTimeout(() => this._reconnect(), 3000)
        })

        mongoose.connection.on('error', (err) => {
            console.error('[mongoDB] Error koneksi:', err.message)
        })
    }

    /**
     * Reconnect helper — dipanggil saat koneksi terputus.
     * Tidak perlu memanggil read() ulang karena model & _data masih valid.
     */
    async _reconnect() {
        try {
            if (mongoose.connection.readyState === 1) return // sudah connected
            await mongoose.connect(this.url, this.options)
            console.log('[mongoDB] Reconnect berhasil')
        } catch (err) {
            console.error('[mongoDB] Reconnect gagal, coba lagi 5 detik:', err.message)
            setTimeout(() => this._reconnect(), 5000)
        }
    }

    /**
     * Tutup koneksi MongoDB dengan bersih.
     * Panggil ini sebelum process.exit() jika perlu graceful shutdown.
     */
    async close() {
        await mongoose.connection.close()
        console.log('[mongoDB] Koneksi ditutup')
    }
}