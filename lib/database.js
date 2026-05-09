const path = require('path')
const _fs = require('fs')
const { promises: fs } = _fs

class Database {
    /**
     * Create new Database
     * @param {String} filepath Path to specified json database
     * @param  {...any} args JSON.stringify arguments
     */
    constructor(filepath, ...args) {
        this.file = path.resolve(filepath)
        this.logger = console

        // [FIX #1 & #2] Inisialisasi semua properti internal SEBELUM _load() dipanggil
        // agar set data(value) → save() → _queue.push() tidak crash karena _queue masih undefined,
        // dan _save() tidak crash karena _jsonargs masih undefined
        this._jsonargs = args
        this._state = false
        this._queue = []

        // Aman dipanggil sekarang karena _jsonargs & _queue sudah siap
        this._load()

        // [FIX #3] Simpan referensi interval agar bisa dibersihkan via close()
        this._interval = setInterval(async () => {
            if (!this._state && this._queue && this._queue[0]) {
                this._state = true
                await this[this._queue.shift()]().catch(this.logger.error)
                this._state = false
            }
        }, 1000)
    }

    get data() {
        return this._data
    }

    set data(value) {
        this._data = value
        this.save()
    }

    /**
     * Queue Load
     */
    load() {
        this._queue.push('_load')
    }

    /**
     * Queue Save
     */
    save() {
        this._queue.push('_save')
    }

    /**
     * [FIX #3] Hentikan interval & kosongkan queue agar tidak ada double write
     * Wajib dipanggil sebelum membuat instance Database baru untuk file yang sama
     */
    close() {
        clearInterval(this._interval)
        this._queue = []
    }

    _load() {
        try {
            return this._data = _fs.existsSync(this.file)
                ? JSON.parse(_fs.readFileSync(this.file))
                : {}
        } catch (e) {
            this.logger.error(e)
            return this._data = {}
        }
    }

    async _save() {
        let dirname = path.dirname(this.file)
        if (!_fs.existsSync(dirname)) await fs.mkdir(dirname, { recursive: true })

        // [FIX #4] Hanya sertakan _jsonargs jika tidak kosong
        // Mencegah whitespace tidak perlu (misal [null, 2]) membengkakkan file
        // tanpa mengorbankan fleksibilitas caller yang memang ingin pretty-print
        const jsonStr = this._jsonargs.length > 0
            ? JSON.stringify(this._data, ...this._jsonargs)
            : JSON.stringify(this._data)

        await fs.writeFile(this.file, jsonStr)
        return this.file
    }
}

module.exports = Database
