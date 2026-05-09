/**
 * Data Keahlian Pemain (Player Skills) 
 * Sumber: CamScanner 01-04-2026
 * Total: 62 Skill (Bilingual: ID & EN)
 */

const keahlianPemain = [
    // --- DRIBBLE & FEINT (12 Skill) ---
    { name: "Tipuan Silang", name_en: "Scissors Feint", description: "Melakukan Tipuan Silang saat memasuki perintah tipuan.", category: "Dribble" },
    { name: "Sentuhan Ganda", name_en: "Double Touch", description: "Melakukan Sentuhan Ganda saat memasuki perintah tipuan.", category: "Dribble" },
    { name: "Flip Flap", name_en: "Flip Flap", description: "Melakukan Flip Flap saat memasuki perintah tipuan.", category: "Dribble" },
    { name: "Marseille Turn", name_en: "Marseille Turn", description: "Melakukan Marseille Turn saat memasuki perintah tipuan.", category: "Dribble" },
    { name: "Sombrero", name_en: "Sombrero", description: "Melakukan Berbalik Sombrero atau Kibasan Berbalik saat menyetop bola, berdasarkan situasi.", category: "Dribble" },
    { name: "Tipuan Bola Pindah Sisi", name_en: "Chop Turn", description: "Melakukan Tipuan Bola Pindah Sisi saat memasuki perintah tipuan.", category: "Dribble" },
    { name: "Potong Belakang & Balik", name_en: "Cut Behind & Turn", description: "Melakukan Cut Behind. Saat berbalik dengan sudut lebar, juga menggunakan gerakan menyetop bola spesial.", category: "Dribble" },
    { name: "Gerakan Scotch", name_en: "Scotch Move", description: "Melakukan Gerakan Scotch saat memasuki perintah tipuan.", category: "Dribble" },
    { name: "Kontrol Telapak", name_en: "Sole Control", description: "Memungkinkan pemain untuk mengontrol bola menggunakan telapak kakinya saat melakukan tipuan dan putaran.", category: "Dribble" },
    { name: "Dribel Kilat", name_en: "Momentum Dribbling", description: "Meningkatkan kemampuan dribel pemain di posisi sepertiga lapangan penyerangan (jauh di wilayah lawan).", category: "Dribble" },
    { name: "Akselerasi Kilat", name_en: "Acceleration Burst", description: "Memungkinkan pemain untuk melakukan Sentuhan Tajam selagi diam atau bergerak perlahan. Tergantung keadaan, gerakan Sentuhan Tajam spesial juga dapat dipicu.", category: "Dribble" },
    { name: "Kaki Magnet", name_en: "Magnetic Feet", description: "Saat menguasai bola, meningkatkan kemampuan pemain untuk mempertahankan bola berdasarkan jumlah lawan dalam radius 5 meter (maks. 4 lawan).", category: "Dribble" },

    // --- SHOOTING & FINISHING (15 Skill) ---
    { name: "Sundulan", name_en: "Heading", description: "Meningkatkan akurasi sundulan serta frekuensi sundulan ke bawah.", category: "Shooting" },
    { name: "Sundulan Roket", name_en: "Bullet Header", description: "Memungkinkan pemain untuk menyundul bola dengan tajam ke arah gawang, menembak dengan kekuatan dan akurasi bahkan dari posisi tanggung atau saat kehilangan keseimbangan.", category: "Shooting" },
    { name: "Lengkung Jauh", name_en: "Long Range Curler", description: "Melakukan Tembakan Terkontrol tajam dan akurat dengan lengkung tingkat tinggi yang sering kali mengenai target meskipun dari jarak jauh.", category: "Shooting" },
    { name: "Tembakan Lengkung Kilat", name_en: "Blitz Curler", description: "Melakukan Tembakan Terkontrol dengan putaran atas tingkat tinggi saat Pengukur Kekuatan terisi minimal 50%.", category: "Shooting" },
    { name: "Kontrol Tembakan Cip", name_en: "Chip Shot Control", description: "Melakukan Tembakan Cip akurat, bahkan saat bergerak dengan kecepatan tinggi.", category: "Shooting" },
    { name: "Tembakan Knuckle", name_en: "Knuckle Shot", description: "Melakukan Tembakan Knuckle saat memasuki perintah Tembakan Memukau saat Pengukur Kekuatan terisi 50-65%. Opsi tendangan bebas yang baik.", category: "Shooting" },
    { name: "Tembakan Menukik", name_en: "Dipping Shot", description: "Melakukan Tembakan Menukik saat memasuki perintah Tembakan Memukau saat Pengukur Kekuatan terisi 20-50%.", category: "Shooting" },
    { name: "Tembakan Roket", name_en: "Rising Shot", description: "Melakukan Tembakan Roket saat memasuki perintah Tembakan Memukau saat Pengukur Kekuatan terisi 65-95%.", category: "Shooting" },
    { name: "Tembakan Jarak Jauh", name_en: "Long Range Shooting", description: "Melakukan Tembakan Jarak Jauh dari luar kotak penalti yang sering kali mengenai target.", category: "Shooting" },
    { name: "Roket Rendah", name_en: "Low Screamer", description: "Melakukan Tembakan Memukau saat Pengukur Kekuatan terisi di bawah 50% akan meningkatkan kecepatan tembakan. Tembakan Menukik tidak akan terjadi.", category: "Shooting" },
    { name: "Solusi Akrobatik", name_en: "Acrobatic Finishing", description: "Memungkinkan pemain untuk mencetak gol dari posisi tanggung atau saat kehilangan keseimbangan.", category: "Shooting" },
    { name: "Trik Tumit", name_en: "Heel Trick", description: "Memungkinkan pemain untuk memberi umpan dan menembak menggunakan tumit, meskipun dari posisi tanggung atau saat kehilangan keseimbangan.", category: "Shooting" },
    { name: "Tembakan Satu Sentuhan", name_en: "First-time Shot", description: "Meningkatkan teknik dan presisi ketika melakukan tembakan first time.", category: "Shooting" },
    { name: "Solusi Fenomenal", name_en: "Phenomenal Finishing", description: "Meningkatkan kekuatan dan akurasi tembakan penyelesaian yang dilakukan dari posisi badan yang tidak biasa.", category: "Shooting" },
    { name: "Tekad Baja", name_en: "Willpower", description: "Meningkatkan kemampuan menembak pemain setiap kali ia menembak, maksimum 8 kali.", category: "Shooting" },

    // --- PASSING (12 Skill) ---
    { name: "Umpan Satu Sentuhan", name_en: "One-Touch Pass", description: "Meningkatkan teknik dan presisi ketika melakukan umpan satu sentuhan.", category: "Passing" },
    { name: "Umpan Terobosan", name_en: "Through Passing", description: "Memungkinkan pemain melakukan umpan dengan lintasan yang tepat. Juga meningkatkan akurasi umpan terobosan secara keseluruhan.", category: "Passing" },
    { name: "Umpan Berbobot", name_en: "Weighted Pass", description: "Melakukan Umpan Lambung atau Umpan Terobosan Lambung yang akurat dengan putaran balik tingkat tinggi ke area depan.", category: "Passing" },
    { name: "Umpan Silang Akurat", name_en: "Pinpoint Crossing", description: "Melakukan umpan silang tajam dan akurat dengan lengkung tingkat tinggi.", category: "Passing" },
    { name: "Umpan Silang Menukik", name_en: "Edged Cross", description: "Memungkinkan pemain melakukan umpan silang berputar secara vertikal yang menukik dengan tajam.", category: "Passing" },
    { name: "Penendang Lengkung Luar", name_en: "Outside Curler", description: "Melakukan tendangan atau umpan berputar yang presisi dengan kaki bagian luar, bahkan dari jarak jauh, menggunakan kaki yang lebih kuat untuk akurasi.", category: "Passing" },
    { name: "Rabona", name_en: "Rabona", description: "Melakukan Rabona untuk mengganggu pemilihan waktu pertahanan dengan tendangan mengejutkan, menggunakan kaki yang lebih kuat untuk akurasi.", category: "Passing" },
    { name: "Umpan Tanpa Melihat", name_en: "No Look Pass", description: "Memungkinkan pemain untuk melakukan umpan tidak terduga dan membingungkan lawan dengan garis pandangnya.", category: "Passing" },
    { name: "Umpan Kritis", name_en: "Game Changing Pass", description: "Meningkatkan kemampuan mengumpan pemain setelah kick-off babak kedua, dalam situasi di mana tim sedang seri atau kalah.", category: "Passing" },
    { name: "Umpan Mata Elang", name_en: "Visionary Pass", description: "Meningkatkan akurasi umpan satu sentuhan, tembakan first-time, dan menyetop bola oleh pemain yang menerima umpan dari pemilik Keahlian ini.", category: "Passing" },
    { name: "Umpan Total", name_en: "Phenomenal Pass", description: "Meningkatkan kekuatan dan akurasi umpan yang dilakukan dari posisi badan yang tidak biasa.", category: "Passing" },
    { name: "Umpan Lambung Rendah", name_en: "Low Lofted Pass", description: "Memungkinkan pemain untuk melakukan Umpan Lambung panjang dan akurat dengan lintasan rendah.", category: "Passing" },

    // --- GOALKEEPER (6 Skill) ---
    { name: "Tendangan GK Rendah", name_en: "GK Low Punt", description: "Memungkinkan pemain untuk melakukan tendangan punt yang akurat dengan lintasan rendah.", category: "Goalkeeper" },
    { name: "Tendangan GK Tinggi", name_en: "GK High Punt", description: "Memungkinkan kiper untuk melakukan tendangan punt tinggi dan panjang yang jatuh di wilayah dalam lawan.", category: "Goalkeeper" },
    { name: "Lemparan Jauh GK", name_en: "GK Long Throw", description: "Meningkatkan jangkauan lemparan oleh kiper.", category: "Goalkeeper" },
    { name: "GK Penahan Penalti", name_en: "GK Penalty Saver", description: "Memungkinkan pemain memiliki reaksi kiper yang lebih baik terhadap tendangan penalti.", category: "Goalkeeper" },
    { name: "Kiper Pengarah Pertahanan", name_en: "GK Directing Defence", description: "Keahlian Kiper yang meningkatkan kemampuan bertahan pemain DF yang ditempatkan paling belakang di area bertahan.", category: "Goalkeeper" },
    { name: "Pekik Tempur Kiper", name_en: "GK Spirit Roar", description: "Keahlian Kiper yang meningkatkan kemampuan fisik pemain DF saat unggul setelah jeda paruh waktu.", category: "Goalkeeper" },

    // --- DEFENSE & PHYSICAL (11 Skill) ---
    { name: "Lemparan Jauh", name_en: "Long Throw", description: "Meningkatkan jarak lemparan jauh.", category: "Defense" },
    { name: "Pengawalan Ketat", name_en: "Man Marking", description: "Bereaksi dengan cepat terhadap gerakan lawan dan melakukan pengawalan ketat yang sulit dihindari.", category: "Defense" },
    { name: "Bantu Bertahan", name_en: "Track Back", description: "Memungkinkan pemain untuk memberikan tekanan agresif kepada pemain lawan yang menguasai bola dari lini depan.", category: "Defense" },
    { name: "Intersepsi", name_en: "Interception", description: "Beraksi dengan cepat untuk mengumpan dan mencegat dengan persentase yang lebih tinggi.", category: "Defense" },
    { name: "Pemblokir", name_en: "Blocker", description: "Bereaksi dengan cepat terhadap tendangan dengan memblokir umpan dan tembakan dengan frekuensi tinggi, dan juga membatasi jumlah rebound.", category: "Defense" },
    { name: "Superioritas Udara", name_en: "Aerial Superiority", description: "Mendapatkan keuntungan selama duel di udara dan mempertahankan akurasi sundulan dengan lebih mudah.", category: "Defense" },
    { name: "Sleding Tekel", name_en: "Sliding Tackle", description: "Melakukan Sleding Tekel dengan akurasi dan kecepatan yang lebih tinggi, dan memenangkan bola dengan lebih mudah.", category: "Defense" },
    { name: "Tekel Jangkauan Panjang", name_en: "Long Reach Tackle", description: "Meningkatkan frekuensi tekel berdiri, meskipun terhadap lawan yang jauh, selagi diam atau bergerak dengan pelan.", category: "Defense" },
    { name: "Benteng", name_en: "Fortress", description: "Meningkatkan kemampuan bertahan pemain setelah peluit babak kedua, selama tim unggul dalam skor.", category: "Defense" },
    { name: "Sapuan Akrobatik", name_en: "Acrobatic Clearance", description: "Memungkinkan pemain untuk menyapu bola menggunakan kaki, meskipun dari posisi tanggung.", category: "Defense" },
    { name: "Benteng Udara", name_en: "Aerial Fort", description: "Meningkatkan kemampuan pemain terkait duel di udara saat berada di dalam kotak penalti sendiri.", category: "Defense" },

    // --- MISC / TEAM (6 Skill) ---
    { name: "Spesialis Penalti", name_en: "Penalty Specialist", description: "Memungkinkan pemain melakukan tendangan penalti dengan akurasi yang lebih tinggi.", category: "Misc" },
    { name: "Keahlian Bermain Game", name_en: "Gamesmanship", description: "Mendapatkan pelanggaran lebih mudah saat menguasai bola.", category: "Misc" },
    { name: "Kapten", name_en: "Captaincy", description: "Menjadi inspirasi tim di lapangan, mengurangi efek kelelahan untuk semua tim.", category: "Misc" },
    { name: "Pemicu Serangan", name_en: "Attack Trigger", description: "Meningkatkan Kesadaran Menyerang semua rekan setim lain saat pemain ini menguasai bola.", category: "Misc" },
    { name: "Pengganti Super", name_en: "Super-sub", description: "Meningkatkan kemampuan pemain ketika dimasukkan ke babak kedua.", category: "Misc" },
    { name: "Semangat Juang", name_en: "Fighting Spirit", description: "Jarang kehilangan akurasi tendangan atau sundulan saat ditekan oleh lawan, dan tidak terlalu terpengaruh oleh kelelahan.", category: "Misc" }
];

module.exports = keahlianPemain;