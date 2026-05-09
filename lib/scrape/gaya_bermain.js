/**
 * Database Playstyle eFootball
 * Lokasi: lib/gaya_bermain.js
 * Deskripsi: Kumpulan data gaya bermain pemain (Indonesia & Inggris)
 */

const dbPlaystyle = [
    { id: "Pemburu Gol", en: "Goal Poacher", desc: "Penyerang predator yang selalu berusaha lolos dari pemain bertahan terakhir.", pos: "CF" },
    { id: "Lari Pancingan", en: "Dummy Runner", desc: "Pemain yang menarik pemain bertahan untuk menciptakan ruang yang dapat dimanfaatkan pemain lain.", pos: "CF/SS/AMF" },
    { id: "Pemburu Peluang", en: "Fox in the Box", desc: "Pemain yang menyusup ke kotak penalti lawan dan hanya menunggu bola.", pos: "CF" },
    { id: "Target Man", en: "Target Man", desc: "Pemain yang memosisikan dirinya sendiri di lini depan sebagai target man dan melindungi bola dengan fisiknya.", pos: "CF" },
    { id: "Penyerang Bayangan", en: "Deep-Lying Forward", desc: "Pemain depan yang mau mundur untuk menerima bola dan membantu menciptakan permainan.", pos: "CF/SS" },
    { id: "Playmaker Kreatif", en: "Creative Playmaker", desc: "Pemain yang memanfaatkan celah pertahanan untuk memulai serangan dan membantu melakukan tendangan ke arah gawang.", pos: "SS/RWF/LWF/AMF/RMF/LMF" },
    { id: "Sayap Produktif", en: "Prolific Winger", desc: "Pemain yang memosisikan diri di sayap untuk menerima umpan, terkadang memotong ke tengah jika ada kesempatan.", pos: "RWF/LWF" },
    { id: "Sayap Penjelajah", en: "Roaming Flank", desc: "Pemain yang cenderung memotong ke dalam dari sayap untuk menerima umpan.", pos: "RWF/LWF/RMF/LMF" },
    { id: "Spesialis Umpan Silang", en: "Cross Specialist", desc: "Pemain yang menunggu di dekat garis lapangan untuk memperoleh kesempatan memberikan umpan silang.", pos: "RWF/LWF/RMF/LMF" },
    { id: "No.10 Klasik", en: "Classic No. 10", desc: "Pengatur serangan yang memulai serangan di dekat area penalti dan akan mencetak gol jika ada kesempatan. Saat bertahan, dia tidak akan berlari cepat untuk menjaga stamina.", pos: "SS/AMF" },
    { id: "Pemburu Celah", en: "Hole Player", desc: "Pemain yang berupaya berlari ke area gawang lawan ketika tim sedang menyerang.", pos: "SS/AMF/RMF/LMF/CMF" },
    { id: "Box to Box", en: "Box to Box", desc: "Pemain yang tanpa lelah menjangkau setiap inci lapangan selama 90 menit penuh.", pos: "RMF/LMF/CMF/DMF" },
    { id: "Pemain Jangkar", en: "Anchor Man", desc: "Pemain tengah bertahan di posisi dalam yang melindungi lini belakang.", pos: "DMF" },
    { id: "Perusak", en: "Destroyer", desc: "Pemain yang gigih menghalau serangan lawan dengan tekel keras dan desakan.", pos: "CMF/DMF/CB" },
    { id: "Orkestrator", en: "Orchestrator", desc: "Pemain yang mengintai di posisi yang lebih dalam dan siap melakukan serangan.", pos: "CMF/DMF" },
    { id: "Pembangun Serangan", en: "Build Up", desc: "Pemain yang suka mundur untuk menerima bola dan memicu serangan dari posisi dalam.", pos: "CB" },
    { id: "Pembantu Serangan", en: "Extra Frontman", desc: "Pemain bertahan yang suka ikut menyerang dan mengepung gawang lawan setiap kali ada kesempatan.", pos: "CB" },
    { id: "Bek Sayap Menyerang", en: "Offensive Wingback", desc: "Bek sayap bermental penyerang yang berlari ke depan dan ikut menyerang jika ada kesempatan.", pos: "RB/LB" },
    { id: "Bek Sayap Bertahan", en: "Defensive Wingback", desc: "Bek sayap kuat yang suka tetap berada di belakang dan melakukan tugas bertahan.", pos: "RB/LB" },
    { id: "Bek Sayap Finisher", en: "Fullback Finisher", desc: "Bek sayap menyerang yang suka ikut menyerang di area tengah atas.", pos: "RB/LB" },
    { id: "Kiper Agresif", en: "Offensive Goalkeeper", desc: "Kiper yang memainkan peran jenis penyapu yang sering keluar untuk menjaga area di belakang pertahanan.", pos: "GK" },
    { id: "Kiper Bertahan", en: "Defensive Goalkeeper", desc: "Kiper kokoh yang lebih suka tetap berada di garis gawang.", pos: "GK" }
];

module.exports = dbPlaystyle;