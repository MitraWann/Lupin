/**
 * levelling.js
 *
 * Fixed:
 *  #1 - global.multiplier = 0 merusak semua rumus XP (threshold jadi 0)
 *       → guard: multiplier yang tidak valid di-fallback ke 1
 *  #2 - findLevel do-while bisa infinite loop untuk XP sangat besar
 *       → tambahkan batas MAX_LEVEL sebagai hard cap iterasi
 */

// [FIX #2] Hard cap iterasi findLevel — level di atas ini tidak pernah dicapai
// secara normal dan melindungi dari infinite loop pada XP sangat besar.
// Naikkan nilai ini jika desain game memang membutuhkan level lebih tinggi.
const MAX_LEVEL = 10_000

module.exports = {
    /**
     * Growth rate
     * `2.576652002695681`
     */
    growth: Math.pow(Math.PI / Math.E, 1.618) * Math.E * .75,

    /**
     * Sanitasi multiplier: tolak nilai yang akan merusak rumus XP.
     * - 0 atau negatif → semua threshold jadi 0, level selalu -1
     * - NaN/undefined  → fallback ke 1
     * [FIX #1]
     */
    _safeMultiplier(multiplier) {
        const m = multiplier ?? global.multiplier ?? 1
        return (typeof m === 'number' && isFinite(m) && m > 0) ? m : 1
    },

    /**
     * get XP range at specified level
     * @param {Number} level
     * @param {Number} multiplier
     */
    xpRange(level, multiplier) {
        // [FIX #1] Pakai _safeMultiplier agar multiplier = 0 tidak merusak rumus
        const m = this._safeMultiplier(multiplier)
        if (level < 0) throw new TypeError('level cannot be negative value')
        level = Math.floor(level)
        let min = level === 0 ? 0 : Math.round(Math.pow(level, this.growth) * m) + 1
        let max = Math.round(Math.pow(++level, this.growth) * m)
        return {
            min,
            max,
            xp: max - min
        }
    },

    /**
     * get level by xp
     * @param {Number} xp
     * @param {Number} multiplier
     */
    findLevel(xp, multiplier) {
        if (xp === Infinity) return Infinity
        if (isNaN(xp)) return NaN
        if (xp <= 0) return -1

        // [FIX #1] Sanitasi multiplier sebelum dipakai di loop
        const m = this._safeMultiplier(multiplier)

        let level = 0
        // [FIX #2] Batasi iterasi dengan MAX_LEVEL agar tidak infinite loop
        // pada XP ekstrem atau jika growth/multiplier menghasilkan min yang stagnan.
        // Kondisi: level < MAX_LEVEL DAN min masih <= xp → lanjut naik level
        do level++
        while (level < MAX_LEVEL && this.xpRange(level, m).min <= xp)

        return --level
    },

    /**
     * is able to level up?
     * @param {Number} level
     * @param {Number} xp
     * @param {Number} multiplier
     */
    canLevelUp(level, xp, multiplier) {
        if (level < 0) return false
        if (xp === Infinity) return true
        if (isNaN(xp)) return false
        if (xp <= 0) return false
        // [FIX #1] Sanitasi multiplier konsisten dengan xpRange & findLevel
        const m = this._safeMultiplier(multiplier)
        return level < this.findLevel(xp, m)
    }
}
