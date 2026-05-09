/**
 * File: lib/booster.js
 * Deskripsi: Data Booster eFootball beserta helper pemrosesan data (Update: Nama EN & Gacha Status)
 * Dibuat oleh Plugin Bot (Senior WhatsApp Bot Developer)
 */

const boosters = [
    {
        name: "Umpan Silang",
        nameEn: "Crossing",
        desc: "Meningkatkan Umpan Lambung, Lengkung, Kecepatan, dan Stamina Statistik Pemain pemain.",
        stats: ["Umpan Lambung", "Lengkung", "Kecepatan", "Stamina"],
        isRandom: true
    },
    {
        name: "Fantasista",
        nameEn: "Fantasista",
        desc: "Meningkatkan Kontrol Bola, Dribel, Penyelesaian, dan Keseimbangan Statistik Pemain pemain.",
        stats: ["Kontrol Bola", "Dribel", "Penyelesaian", "Keseimbangan"],
        isRandom: true
    },
    {
        name: "Regista",
        nameEn: "Regista",
        desc: "Meningkatkan Dribel Akurat, Umpan Rendah, Kesadaran Bertahan, dan Menekel Statistik Pemain pemain.",
        stats: ["Dribel Akurat", "Umpan Rendah", "Kesadaran Bertahan", "Menekel"],
        isRandom: false
    },
    {
        name: "Bangun Serangan dari Belakang",
        nameEn: "Rebuilding",
        desc: "Meningkatkan Umpan Rendah, Kesadaran Bertahan, Agresi, dan Keterlibatan Bertahan Statistik Pemain pemain.",
        stats: ["Umpan Rendah", "Kesadaran Bertahan", "Agresi", "Keterlibatan Bertahan"],
        isRandom: false
    },
    {
        name: "Akurasi",
        nameEn: "Accuracy",
        desc: "Meningkatkan Umpan Rendah, Umpan Lambung, Penyelesaian, dan Kekuatan Tendangan Statistik Pemain pemain.",
        stats: ["Umpan Rendah", "Umpan Lambung", "Penyelesaian", "Kekuatan Tendangan"],
        isRandom: false
    },
    {
        name: "Kreator Serangan",
        nameEn: "Offence Creator",
        desc: "Meningkatkan Kesadaran Menyerang, Kontrol Bola, Umpan Rendah, dan Kekuatan Tendangan Statistik Pemain pemain.",
        stats: ["Kesadaran Menyerang", "Kontrol Bola", "Umpan Rendah", "Kekuatan Tendangan"],
        isRandom: true
    },
    {
        name: "Pelindung Bola",
        nameEn: "Ball Protection",
        desc: "Meningkatkan Kontrol Bola, Dribel Akurat, Kontak Fisik, dan Keseimbangan Statistik Pemain pemain.",
        stats: ["Kontrol Bola", "Dribel Akurat", "Kontak Fisik", "Keseimbangan"],
        isRandom: false
    },
    {
        name: "Penyeimbang",
        nameEn: "Balancer",
        desc: "Meningkatkan Kesadaran Menyerang, Kesadaran Bertahan, Akselerasi, dan Stamina Statistik Pemain pemain.",
        stats: ["Kesadaran Menyerang", "Kesadaran Bertahan", "Akselerasi", "Stamina"],
        isRandom: true
    },
    {
        name: "Balasan",
        nameEn: "Counter",
        desc: "Meningkatkan Umpan Rendah, Menekel, Keterlibatan Bertahan, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Umpan Rendah", "Menekel", "Keterlibatan Bertahan", "Kontak Fisik"],
        isRandom: false
    },
    {
        name: "Pertahanan Udara",
        nameEn: "Aerial Block",
        desc: "Meningkatkan Sundulan, Kesadaran Bertahan, Melompat, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Sundulan", "Kesadaran Bertahan", "Melompat", "Kontak Fisik"],
        isRandom: false
    },
    {
        name: "Tembakan",
        nameEn: "Shooting",
        desc: "Meningkatkan Kontrol Bola, Penyelesaian, Kekuatan Tendangan, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Kontrol Bola", "Penyelesaian", "Kekuatan Tendangan", "Kontak Fisik"],
        isRandom: true
    },
    {
        name: "Eksekusi Tendangan Bebas",
        nameEn: "Free-kick Taking",
        desc: "Meningkatkan Penyelesaian, Eksekusi Bola Mati, Lengkung, dan Kekuatan Tendangan Statistik Pemain pemain.",
        stats: ["Penyelesaian", "Eksekusi Bola Mati", "Lengkung", "Kekuatan Tendangan"],
        isRandom: true
    },
    {
        name: "Di Udara",
        nameEn: "Aerial",
        desc: "Meningkatkan Penyelesaian, Sundulan, Melompat, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Penyelesaian", "Sundulan", "Melompat", "Kontak Fisik"],
        isRandom: false
    },
    {
        name: "Umpan",
        nameEn: "Passing",
        desc: "Meningkatkan Umpan Rendah, Umpan Lambung, Lengkung, dan Kekuatan Tendangan Statistik Pemain pemain.",
        stats: ["Umpan Rendah", "Umpan Lambung", "Lengkung", "Kekuatan Tendangan"],
        isRandom: true
    },
    {
        name: "Menggiring Bola",
        nameEn: "Ball-carrying",
        desc: "Meningkatkan Dribel, Dribel Akurat, Kecepatan, dan Keseimbangan Statistik Pemain pemain.",
        stats: ["Dribel", "Dribel Akurat", "Kecepatan", "Keseimbangan"],
        isRandom: true
    },
    {
        name: "Teknik",
        nameEn: "Technique",
        desc: "Meningkatkan Kontrol Bola, Dribel, Dribel Akurat, dan Umpan Rendah Statistik Pemain pemain.",
        stats: ["Kontrol Bola", "Dribel", "Dribel Akurat", "Umpan Rendah"],
        isRandom: true
    },
    {
        name: "Bertahan",
        nameEn: "Defending",
        desc: "Meningkatkan Kesadaran Bertahan, Menekel, Akselerasi, dan Melompat Statistik Pemain pemain.",
        stats: ["Kesadaran Bertahan", "Menekel", "Akselerasi", "Melompat"],
        isRandom: false
    },
    {
        name: "Duel",
        nameEn: "Duelling",
        desc: "Meningkatkan Kesadaran Bertahan, Menekel, Kecepatan, dan Stamina Statistik Pemain pemain.",
        stats: ["Kesadaran Bertahan", "Menekel", "Kecepatan", "Stamina"],
        isRandom: false
    },
    {
        name: "Kelincahan",
        nameEn: "Agility",
        desc: "Meningkatkan Kecepatan, Akselerasi, Keseimbangan, dan Stamina Statistik Pemain pemain.",
        stats: ["Kecepatan", "Akselerasi", "Keseimbangan", "Stamina"],
        isRandom: true
    },
    {
        name: "Fisik",
        nameEn: "Physicality",
        desc: "Meningkatkan Melompat, Kontak Fisik, Keseimbangan, dan Stamina Statistik Pemain pemain.",
        stats: ["Melompat", "Kontak Fisik", "Keseimbangan", "Stamina"],
        isRandom: true
    },
    {
        name: "Kemampuan Kiper",
        nameEn: "Goalkeeping",
        desc: "Meningkatkan Kesadaran Kiper, Tangkapan Kiper, Tepisan Kiper, dan Refleks Kiper Statistik Pemain pemain.",
        stats: ["Kesadaran Kiper", "Tangkapan Kiper", "Tepisan Kiper", "Refleks Kiper"],
        isRandom: false
    },
    {
        name: "Naluri Penyerang",
        nameEn: "Striker's Instinct",
        desc: "Meningkatkan Kesadaran Menyerang, Kontrol Bola, Penyelesaian, dan Akselerasi Statistik Pemain pemain.",
        stats: ["Kesadaran Menyerang", "Kontrol Bola", "Penyelesaian", "Akselerasi"],
        isRandom: true
    },
    {
        name: "Melumpuhkan",
        nameEn: "Shutdown",
        desc: "Meningkatkan Kesadaran Bertahan, Menekel, Keterlibatan Bertahan, dan Kecepatan Statistik Pemain pemain.",
        stats: ["Kesadaran Bertahan", "Menekel", "Keterlibatan Bertahan", "Kecepatan"],
        isRandom: false
    },
    {
        name: "Pekerja Keras",
        nameEn: "Hard Worker",
        desc: "Meningkatkan Agresi, Akselerasi, Kontak Fisik, dan Stamina Statistik Pemain pemain.",
        stats: ["Agresi", "Akselerasi", "Kontak Fisik", "Stamina"],
        isRandom: false
    },
    {
        name: "Penyelamatan",
        nameEn: "Saving",
        desc: "Meningkatkan Kesadaran Kiper, Tepisan Kiper, Refleks Kiper, dan Jangkauan Kiper Statistik Pemain pemain.",
        stats: ["Kesadaran Kiper", "Tepisan Kiper", "Refleks Kiper", "Jangkauan Kiper"],
        isRandom: false
    },
    {
        name: "Terobosan",
        nameEn: "Breakthrough",
        desc: "Meningkatkan Dribel, Kecepatan, Kekuatan Tendangan, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Dribel", "Kecepatan", "Kekuatan Tendangan", "Kontak Fisik"],
        isRandom: true
    },
    {
        name: "Kekuatan",
        nameEn: "Strength",
        desc: "Meningkatkan Kecepatan, Kekuatan Tendangan, Melompat, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Kecepatan", "Kekuatan Tendangan", "Melompat", "Kontak Fisik"],
        isRandom: true
    },
    {
        name: "Gerakan Tanpa Bola",
        nameEn: "Off the Ball",
        desc: "Meningkatkan Kesadaran Menyerang, Kecepatan, Akselerasi, dan Stamina Statistik Pemain pemain.",
        stats: ["Kesadaran Menyerang", "Kecepatan", "Akselerasi", "Stamina"],
        isRandom: true
    },
    {
        name: "Pencuri Bola",
        nameEn: "Stealing",
        desc: "Meningkatkan Menekel, Agresi, Akselerasi, dan Kontak Fisik Statistik Pemain pemain.",
        stats: ["Menekel", "Agresi", "Akselerasi", "Kontak Fisik"],
        isRandom: false
    }
];

/**
 * Mengambil semua data booster
 * @returns {Array} List of all boosters
 */
const getAllBoosters = () => boosters;

/**
 * Mencari booster berdasarkan nama ID atau EN (case-insensitive)
 * @param {string} name - Nama booster yang ingin dicari (ID/EN)
 * @returns {Object|null} Objek booster jika ditemukan, null jika tidak
 */
const findBoosterByName = (name) => {
    return boosters.find(b => 
        b.name.toLowerCase().includes(name.toLowerCase()) || 
        b.nameEn.toLowerCase().includes(name.toLowerCase())
    ) || null;
};

/**
 * Mengambil list booster yang berhak diacak (gacha token)
 * @returns {Array} Array berisi objek booster
 */
const getRandomizableBoosters = () => {
    return boosters.filter(b => b.isRandom === true);
};

module.exports = {
    boosters,
    getAllBoosters,
    findBoosterByName,
    getRandomizableBoosters
};