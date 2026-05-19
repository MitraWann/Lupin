/**
 * Plugin: Demo Semua Fitur MessageBuilder
 * Deskripsi: Menampilkan demo setiap fitur Button & AIRich dari MessageBuilder v4.0
 *            Satu command = satu fitur
 *
 * DAFTAR COMMAND:
 *  ── BUTTON (Interaktif) ──
 *  .demoreply        → Button: Quick Reply biasa
 *  .demourl          → Button: Tombol URL
 *  .democopy         → Button: Tombol Copy (salin kode)
 *  .democall         → Button: Tombol Call
 *  .demolist         → Button: List/Selection (dropdown)
 *  .demomixed        → Button: Campuran (reply + url + copy)
 *  .demomedia        → Button: Dengan lampiran gambar
 *  .demothumbnail    → Button: Header dari Buffer/jpegThumbnail [v4.0]
 *  .demoaudiofooter  → Button: Footer dengan pesan audio [v4.0]
 *  .democarousel     → Button: Kartu carousel horizontal [v4.0]
 *
 *  ── AIRICH (Rich Message) ──
 *  .demoaitext       → AIRich: Teks markdown
 *  .demoaicode       → AIRich: Blok kode dengan syntax highlight
 *  .demoaitable      → AIRich: Tabel data
 *  .demoaisource     → AIRich: Sumber/referensi link
 *  .demoaiimage      → AIRich: Gambar tunggal
 *  .demoaiimages     → AIRich: Banyak gambar (array/galeri)
 *  .demoaiinline     → AIRich: Gambar inline dengan alignment & tapLink [v4.0]
 *  .demoaidynamic    → AIRich: GIF animasi / gambar dinamis [v4.0]
 *  .demoaimap        → AIRich: Peta interaktif dengan marker [v4.0]
 *  .demoailatex      → AIRich: Rumus matematika LaTeX [v4.0]
 *  .demoaifull       → AIRich: Semua elemen sekaligus (termasuk fitur v4.0)
 */

const { Button, Carousel, AIRich } = require('../lib/MessageBuilder.js')

let handler = async (m, { conn, usedPrefix, command, args }) => {
    let act = command.toLowerCase()

    // ══════════════════════════════════════════════
    // 1. DEMO: Quick Reply biasa
    // ══════════════════════════════════════════════
    if (act === 'demoreply') {
        await new Button()
            .setTitle('Demo Quick Reply')
            .setBody('Ini adalah contoh pesan dengan tombol quick reply.\nPilih salah satu opsi di bawah:')
            .setFooter('MessageBuilder v4.0 — addReply()')
            .addReply('✅ Setuju', 'reply_setuju')
            .addReply('❌ Tidak Setuju', 'reply_tidak')
            .addReply('🤔 Mungkin', 'reply_mungkin')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 2. DEMO: Tombol URL
    // ══════════════════════════════════════════════
    else if (act === 'demourl') {
        await new Button()
            .setTitle('Demo Tombol URL')
            .setBody('Klik tombol di bawah untuk membuka tautan eksternal.\nWebview juga bisa diaktifkan.')
            .setFooter('MessageBuilder v4.0 — addUrl()')
            .addUrl('🌐 Buka Google', 'https://google.com', false)
            .addUrl('📺 YouTube (Webview)', 'https://youtube.com', true)
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 3. DEMO: Tombol Copy Code
    // ══════════════════════════════════════════════
    else if (act === 'democopy') {
        let kodePromo = 'PROMO2025'
        await new Button()
            .setTitle('Demo Tombol Copy')
            .setBody(`Kode promo kamu hari ini:\n\n*${kodePromo}*\n\nTekan tombol di bawah untuk menyalinnya secara otomatis.`)
            .setFooter('MessageBuilder v4.0 — addCopy()')
            .addCopy('📋 Salin Kode Promo', kodePromo, 'copy_promo')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 4. DEMO: Tombol Call
    // ══════════════════════════════════════════════
    else if (act === 'democall') {
        await new Button()
            .setTitle('Demo Tombol Call')
            .setBody('Butuh bantuan? Hubungi CS kami langsung melalui tombol di bawah ini.')
            .setFooter('MessageBuilder v4.0 — addCall()')
            .addCall('📞 Hubungi CS', 'call_cs')
            .addUrl('💬 Chat via Web', 'https://wa.me/6281234567890', false)
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 5. DEMO: List / Selection (Dropdown)
    // ══════════════════════════════════════════════
    else if (act === 'demolist') {
        await new Button()
            .setTitle('Demo List Selection')
            .setBody('Pilih menu layanan yang kamu butuhkan dari daftar di bawah:')
            .setFooter('MessageBuilder v4.0 — addSelection()')
            .addSelection('Pilih Layanan')
                .makeSections('🛒 Produk', 'Populer')
                    .makeRow('', 'Pulsa', 'Isi ulang pulsa semua operator', 'list_pulsa')
                    .makeRow('', 'Paket Data', 'Kuota internet murah', 'list_data')
                    .makeRow('', 'Token Listrik', 'Token PLN prabayar', 'list_token')
                .makeSections('🎮 Game')
                    .makeRow('', 'Mobile Legends', 'Top up diamond ML', 'list_ml')
                    .makeRow('', 'Free Fire', 'Top up diamond FF', 'list_ff')
                    .makeRow('', 'PUBG Mobile', 'Top up UC PUBG', 'list_pubg')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 6. DEMO: Mixed Button (campuran tombol)
    // ══════════════════════════════════════════════
    else if (act === 'demomixed') {
        await new Button()
            .setTitle('Demo Mixed Buttons')
            .setBody('Contoh penggunaan beberapa jenis tombol sekaligus dalam satu pesan.')
            .setFooter('MessageBuilder v4.0 — mixed buttons')
            .addReply('✅ Konfirmasi', 'mixed_konfirm')
            .addUrl('🔗 Lihat Detail', 'https://example.com', false)
            .addCopy('📋 Salin Nomor Ref', 'REF-XYZ-789', 'mixed_copy')
            .addLocation()
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 7. DEMO: Button dengan Media (Gambar dari URL)
    // ══════════════════════════════════════════════
    else if (act === 'demomedia') {
        await new Button()
            .setImage('https://picsum.photos/800/400', { caption: '' })
            .setTitle('Demo Button + Media')
            .setBody('Tombol interaktif bisa dilengkapi dengan gambar, video, atau dokumen sebagai header.')
            .setFooter('MessageBuilder v4.0 — setImage()')
            .addReply('❤️ Suka', 'media_suka')
            .addReply('👎 Tidak Suka', 'media_tidak')
            .addUrl('🖼️ Lihat Asli', 'https://picsum.photos/800/400', true)
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 8. [v4.0] DEMO: Button dengan Thumbnail Buffer
    // ══════════════════════════════════════════════
    else if (act === 'demothumbnail') {
        // Ambil gambar kecil sebagai Buffer lalu jadikan jpegThumbnail header
        // Tidak perlu upload ke server WA — cocok untuk gambar kecil/ikon
        const https = require('https')
        const fetchBuffer = (url) => new Promise((resolve, reject) => {
            https.get(url, res => {
                const chunks = []
                res.on('data', c => chunks.push(c))
                res.on('end', () => resolve(Buffer.concat(chunks)))
                res.on('error', reject)
            })
        })

        const thumbBuf = await fetchBuffer('https://picsum.photos/200/200?random=5')

        await new Button()
            .setThumbnail(thumbBuf)
            .setTitle('Demo setThumbnail()')
            .setBody(
                'Header gambar ini dimuat langsung dari *Buffer* (tidak diupload ke server WA).\n\n' +
                'Cocok digunakan untuk thumbnail kecil atau ikon yang sudah ada di memori.'
            )
            .setFooter('MessageBuilder v4.0 — setThumbnail()')
            .addReply('👍 Mantap', 'thumb_ok')
            .addReply('🔄 Coba Lagi', 'thumb_retry')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 9. [v4.0] DEMO: Button dengan Audio Footer
    // ══════════════════════════════════════════════
    else if (act === 'demoaudiofooter') {
        await new Button()
            .setTitle('Demo Audio Footer')
            .setBody(
                'Pesan ini memiliki *audio* yang terpasang di bagian footer.\n\n' +
                'Fitur ini sesuai proto: `InteractiveMessage.Footer.audioMessage`\n' +
                'Berguna untuk pesan notifikasi, panduan suara, atau iklan audio.'
            )
            .setFooter('MessageBuilder v4.0 — setAudioFooter()')
            // Ganti URL di bawah dengan audio yang valid (.ogg/.mp3)
            .setAudioFooter('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
                mimetype: 'audio/mpeg',
                ptt: false
            })
            .addReply('▶️ Putar Audio', 'audio_play')
            .addUrl('🔗 Sumber Audio', 'https://www.soundhelix.com', false)
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 10. [v4.0] DEMO: Carousel
    // ══════════════════════════════════════════════
    else if (act === 'democarousel') {
        // Buat masing-masing card carousel menggunakan class Carousel
        const card1 = new Carousel()
            .setTitle('Paket Basic')
            .setBody('Kuota 5 GB — Rp 25.000\nCocok untuk penggunaan ringan sehari-hari.')
            .setFooter('Masa aktif 30 hari')
            .setImage('https://picsum.photos/400/300?random=1')
            .addReply('🛒 Beli Sekarang', 'carousel_beli_basic')
            .addUrl('📄 Lihat Detail', 'https://example.com/basic', false)

        const card2 = new Carousel()
            .setTitle('Paket Standard')
            .setBody('Kuota 15 GB — Rp 50.000\nIdeal untuk streaming dan media sosial.')
            .setFooter('Masa aktif 30 hari')
            .setImage('https://picsum.photos/400/300?random=2')
            .addReply('🛒 Beli Sekarang', 'carousel_beli_standard')
            .addUrl('📄 Lihat Detail', 'https://example.com/standard', false)

        const card3 = new Carousel()
            .setTitle('Paket Pro')
            .setBody('Kuota 30 GB — Rp 85.000\nPilihan terbaik untuk kerja dari rumah.')
            .setFooter('Masa aktif 30 hari')
            .setImage('https://picsum.photos/400/300?random=3')
            .addReply('🛒 Beli Sekarang', 'carousel_beli_pro')
            .addCopy('📋 Salin Kode Diskon', 'DISKON30', 'carousel_copy_pro')
            .addUrl('📄 Lihat Detail', 'https://example.com/pro', false)

        const card4 = new Carousel()
            .setTitle('Paket Unlimited')
            .setBody('Kuota Unlimited — Rp 150.000\nTanpa batas, tanpa khawatir kehabisan kuota.')
            .setFooter('Masa aktif 30 hari')
            .setImage('https://picsum.photos/400/300?random=4')
            .addReply('🛒 Beli Sekarang', 'carousel_beli_unlimited')
            .addUrl('📄 Lihat Detail', 'https://example.com/unlimited', false)

        await new Button()
            .setBody('Pilih paket data terbaik untukmu 👇\nGeser kartu untuk melihat semua pilihan.')
            .setFooter('MessageBuilder v4.0 — addCarousel()')
            .addCarousel(card1, 'hscroll')
            .addCarousel(card2, 'hscroll')
            .addCarousel(card3, 'hscroll')
            .addCarousel(card4, 'hscroll')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 11. DEMO: AIRich — Teks Markdown
    // ══════════════════════════════════════════════
    else if (act === 'demoaitext') {
        await new AIRich()
            .addText(
                `*Demo AIRich — addText()*\n\n` +
                `AIRich mendukung format teks _markdown_ seperti WhatsApp pada umumnya.\n\n` +
                `Kamu bisa menulis:\n` +
                `• *Teks tebal*\n` +
                `• _Teks miring_\n` +
                `• ~Teks coret~\n` +
                `• \`Teks monospace\`\n\n` +
                `Teks panjang dan multi-paragraf juga didukung penuh di sini.`
            )
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 12. DEMO: AIRich — Blok Kode
    // ══════════════════════════════════════════════
    else if (act === 'demoaicode') {
        let contohKode = `// Contoh fungsi async JavaScript
async function fetchData(url) {
    try {
        const response = await fetch(url)
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Gagal fetch:', error)
        return null
    }
}

// Penggunaan
const result = await fetchData('https://api.example.com/users')
console.log(result)`

        await new AIRich()
            .addText('*Demo AIRich — addCode()*\n\nBerikut contoh blok kode JavaScript dengan syntax highlighting:')
            .addCode('javascript', contohKode)
            .addText('_Syntax highlighting otomatis mengenali keyword, string, angka, dan komentar._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 13. DEMO: AIRich — Tabel
    // ══════════════════════════════════════════════
    else if (act === 'demoaitable') {
        let tabelHarga = [
            ['Paket', 'Kuota', 'Masa Aktif', 'Harga'],
            ['Basic', '5 GB', '30 hari', 'Rp 25.000'],
            ['Standard', '15 GB', '30 hari', 'Rp 50.000'],
            ['Pro', '30 GB', '30 hari', 'Rp 85.000'],
            ['Unlimited', 'Unlimited', '30 hari', 'Rp 150.000'],
        ]

        await new AIRich()
            .addText('*Demo AIRich — addTable()*\n\nBerikut daftar harga paket data:')
            .addTable(tabelHarga)
            .addText('_Baris pertama array otomatis dijadikan header tabel._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 14. DEMO: AIRich — Sumber / Referensi Link
    // ══════════════════════════════════════════════
    else if (act === 'demoaisource') {
        await new AIRich()
            .addText('*Demo AIRich — addSource()*\n\nBerikut referensi sumber informasi terkait:')
            .addSource([
                ['https://github.githubassets.com/favicons/favicon.png', 'https://github.com/WhiskeySockets/Baileys', 'WhiskeySockets/Baileys — GitHub'],
                ['https://www.npmjs.com/favicon.ico', 'https://www.npmjs.com/package/@whiskeysockets/baileys', '@whiskeysockets/baileys — npm'],
                ['https://baileys.wiki/img/favicon.ico', 'https://baileys.wiki', 'Baileys Official Wiki'],
            ])
            .addText('_Setiap sumber ditampilkan dengan favicon, judul, dan link yang bisa diklik._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 15. DEMO: AIRich — Gambar Tunggal
    // ══════════════════════════════════════════════
    else if (act === 'demoaiimage') {
        await new AIRich()
            .addText('*Demo AIRich — addImage() (tunggal)*\n\nMenampilkan satu gambar dari URL:')
            .addImage('https://picsum.photos/600/400?random=1')
            .addText('_Gambar dirender langsung dalam tampilan AI Rich Message._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 16. DEMO: AIRich — Banyak Gambar (Array/Galeri)
    // ══════════════════════════════════════════════
    else if (act === 'demoaiimages') {
        await new AIRich()
            .addText('*Demo AIRich — addImage() (array/galeri)*\n\nMenampilkan beberapa gambar sekaligus:')
            .addImage([
                'https://picsum.photos/600/400?random=10',
                'https://picsum.photos/600/400?random=20',
                'https://picsum.photos/600/400?random=30',
            ])
            .addText('_Array URL akan dirender sebagai galeri gambar dalam satu blok._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 17. [v4.0] DEMO: AIRich — Gambar Inline
    // ══════════════════════════════════════════════
    else if (act === 'demoaiinline') {
        await new AIRich()
            .addText('*Demo AIRich — addInlineImage()* [v4.0]\n\nGambar inline mendukung pengaturan alignment dan link saat gambar diklik.')
            // Rata kiri
            .addInlineImage('https://picsum.photos/400/250?random=40', {
                imageText:  'Gambar rata kiri — alignment: left',
                alignment:  'left',
                tapLinkUrl: 'https://picsum.photos'
            })
            // Rata tengah
            .addInlineImage('https://picsum.photos/400/250?random=41', {
                imageText:  'Gambar rata tengah — alignment: center',
                alignment:  'center',
                tapLinkUrl: 'https://picsum.photos'
            })
            // Rata kanan
            .addInlineImage('https://picsum.photos/400/250?random=42', {
                imageText:  'Gambar rata kanan — alignment: right',
                alignment:  'right',
                tapLinkUrl: 'https://picsum.photos'
            })
            .addText('_Klik salah satu gambar di atas untuk membuka tautan sumbernya._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 18. [v4.0] DEMO: AIRich — Gambar Dinamis / GIF
    // ══════════════════════════════════════════════
    else if (act === 'demoaidynamic') {
        await new AIRich()
            .addText('*Demo AIRich — addDynamic()* [v4.0]\n\nMendukung gambar statis maupun GIF animasi dengan opsi pengulangan.')
            // Gambar statis
            .addDynamic('https://picsum.photos/600/350?random=50', 'image')
            .addText('_⬆️ Gambar statis (type: image)_')
            // GIF animasi — loop 3 kali
            .addDynamic('https://media.giphy.com/media/3o7aD4GrHuCDDfKmHu/giphy.gif', 'gif', 3)
            .addText('_⬆️ GIF animasi (type: gif, loopCount: 3 — berhenti setelah 3 putaran)_')
            // GIF animasi — loop tak terbatas
            .addDynamic('https://media.giphy.com/media/xT9IgG50Lg7rusyOOV/giphy.gif', 'gif', 0)
            .addText('_⬆️ GIF animasi (type: gif, loopCount: 0 — loop selamanya)_')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 19. [v4.0] DEMO: AIRich — Peta Interaktif
    // ══════════════════════════════════════════════
    else if (act === 'demoaimap') {
        await new AIRich()
            .addText('*Demo AIRich — addMap()* [v4.0]\n\nPeta interaktif dengan beberapa marker/anotasi lokasi di Makassar, Sulawesi Selatan.')
            .addMap(
                // Pusat peta: Kota Makassar
                { latitude: -5.1477, longitude: 119.4327, latDelta: 0.08, lngDelta: 0.08 },
                // Anotasi marker
                [
                    {
                        lat:   -5.1477,
                        lng:   119.4327,
                        title: 'Kota Makassar',
                        body:  'Ibu kota Provinsi Sulawesi Selatan'
                    },
                    {
                        lat:   -5.1336,
                        lng:   119.4063,
                        title: 'Fort Rotterdam',
                        body:  'Benteng bersejarah peninggalan Belanda'
                    },
                    {
                        lat:   -5.1571,
                        lng:   119.4487,
                        title: 'Trans Studio Makassar',
                        body:  'Taman hiburan indoor terbesar di Indonesia'
                    },
                    {
                        lat:   -5.1500,
                        lng:   119.4200,
                        title: 'Pantai Losari',
                        body:  'Ikon wisata bahari Kota Makassar'
                    }
                ],
                true // tampilkan daftar info di bawah peta
            )
            .addText('_Peta di atas menampilkan 4 lokasi ikonik di Makassar. Tap marker untuk melihat detail._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 20. [v4.0] DEMO: AIRich — Rumus LaTeX
    // ══════════════════════════════════════════════
    else if (act === 'demoailatex') {
        // URL gambar LaTeX dihasilkan via layanan latex.codecogs.com
        // Encode spasi dan simbol khusus dalam URL
        const latexBase = 'https://latex.codecogs.com/png.image?%5Cdpi%7B150%7D%5Cbg%7Bwhite%7D'

        await new AIRich()
            .addText('*Demo AIRich — addLatex()* [v4.0]\n\nMenampilkan ekspresi matematika dalam format LaTeX yang dirender sebagai gambar.')
            // Rumus 1: Luas lingkaran
            .addLatex('📐 Rumus Luas Lingkaran:', [
                {
                    latex:      'A = \\pi r^2',
                    url:        `${latexBase}A%20%3D%20%5Cpi%20r%5E2`,
                    width:      160,
                    height:     50,
                    fontHeight: 16
                }
            ])
            // Rumus 2: Teorema Pythagoras
            .addLatex('📐 Teorema Pythagoras:', [
                {
                    latex:      'c^2 = a^2 + b^2',
                    url:        `${latexBase}c%5E2%20%3D%20a%5E2%20%2B%20b%5E2`,
                    width:      200,
                    height:     50,
                    fontHeight: 16
                }
            ])
            // Rumus 3: Persamaan kuadrat (beberapa ekspresi sekaligus)
            .addLatex('📐 Rumus Persamaan Kuadrat & Diskriminan:', [
                {
                    latex:      'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
                    url:        `${latexBase}x%20%3D%20%5Cfrac%7B-b%20%5Cpm%20%5Csqrt%7Bb%5E2%20-%204ac%7D%7D%7B2a%7D`,
                    width:      280,
                    height:     60,
                    fontHeight: 16
                },
                {
                    latex:      'D = b^2 - 4ac',
                    url:        `${latexBase}D%20%3D%20b%5E2%20-%204ac`,
                    width:      180,
                    height:     50,
                    fontHeight: 16
                }
            ])
            .addText('_Rumus di atas dirender menggunakan layanan latex.codecogs.com sebagai gambar PNG._')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // 21. DEMO: AIRich — FULL v4.0 (semua elemen)
    // ══════════════════════════════════════════════
    else if (act === 'demoaifull') {
        const tabelFitur = [
            ['Fitur',          'Method',             'Versi'],
            ['Teks',           'addText()',           'v3.1'],
            ['Kode',           'addCode()',           'v3.1'],
            ['Tabel',          'addTable()',          'v3.1'],
            ['Gambar (grid)',   'addImage()',          'v3.1'],
            ['Sumber',         'addSource()',         'v3.1'],
            ['Gambar Inline',  'addInlineImage()',    'v4.0'],
            ['GIF / Dinamis',  'addDynamic()',        'v4.0'],
            ['Peta',           'addMap()',            'v4.0'],
            ['LaTeX',          'addLatex()',          'v4.0'],
        ]

        const kodePendek = `const ai = new AIRich()
ai.addText('Halo!')
  .addCode('javascript', 'console.log(42)')
  .addInlineImage('https://...', { alignment: 'center' })
  .addMap({ latitude: -5.14, longitude: 119.43 }, [...])
  .addLatex('Rumus:', [{ latex: 'E = mc^2', url: '...' }])
  .run(chat, conn)`

        const latexBase = 'https://latex.codecogs.com/png.image?%5Cdpi%7B120%7D%5Cbg%7Bwhite%7D'

        await new AIRich()
            // Pembuka
            .addText(
                `*🧪 Demo AIRich FULL v4.0 — Semua Fitur*\n\n` +
                `Pesan ini menggabungkan semua elemen AIRich (v3.1 + v4.0) dalam satu chain:\n` +
                `teks, tabel, kode, gambar, sumber, inline image, GIF, peta, dan LaTeX.`
            )
            // Tabel ringkasan fitur
            .addTable(tabelFitur)
            // Blok kode contoh
            .addText('*📝 Contoh penggunaan:*')
            .addCode('javascript', kodePendek)
            // Gambar grid biasa
            .addText('*🖼️ Gambar grid (addImage):*')
            .addImage('https://picsum.photos/600/300?random=99')
            // Gambar inline dengan alignment
            .addText('*📌 Gambar inline (addInlineImage) — center + tapLink:*')
            .addInlineImage('https://picsum.photos/500/280?random=88', {
                imageText:  'Tap gambar ini untuk membuka link',
                alignment:  'center',
                tapLinkUrl: 'https://picsum.photos'
            })
            // GIF dinamis
            .addText('*🎞️ GIF Dinamis (addDynamic):*')
            .addDynamic('https://media.giphy.com/media/3o7aD4GrHuCDDfKmHu/giphy.gif', 'gif', 2)
            // Peta
            .addText('*🗺️ Peta Interaktif (addMap):*')
            .addMap(
                { latitude: -5.1477, longitude: 119.4327, latDelta: 0.06, lngDelta: 0.06 },
                [
                    { lat: -5.1477, lng: 119.4327, title: 'Makassar', body: 'Ibu kota Sulsel' },
                    { lat: -5.1500, lng: 119.4200, title: 'Pantai Losari', body: 'Ikon wisata Makassar' }
                ]
            )
            // LaTeX
            .addText('*🔢 Rumus LaTeX (addLatex):*')
            .addLatex('Persamaan Einstein:', [
                {
                    latex:      'E = mc^2',
                    url:        `${latexBase}E%20%3D%20mc%5E2`,
                    width:      160,
                    height:     50,
                    fontHeight: 16
                }
            ])
            // Sumber referensi
            .addText('*📚 Sumber Referensi (addSource):*')
            .addSource([
                ['https://github.githubassets.com/favicons/favicon.png', 'https://github.com/WhiskeySockets/Baileys', 'Baileys Repository'],
                ['https://www.npmjs.com/favicon.ico', 'https://www.npmjs.com/package/@whiskeysockets/baileys', '@whiskeysockets/baileys — npm'],
            ])
            // Penutup
            .addText('_Semua elemen di atas ditampilkan dalam satu pesan AI Rich — dibangun dengan MessageBuilder v4.0_ 🎉')
            .run(m.chat, conn, m)
    }

    // ══════════════════════════════════════════════
    // FALLBACK: Tampilkan daftar command demo
    // ══════════════════════════════════════════════
    else {
        return m.reply(
            `*🧰 Demo MessageBuilder v4.0*\n\n` +
            `*— BUTTON (Interaktif) —*\n` +
            `• ${usedPrefix}demoreply → Quick Reply\n` +
            `• ${usedPrefix}demourl → Tombol URL\n` +
            `• ${usedPrefix}democopy → Tombol Copy\n` +
            `• ${usedPrefix}democall → Tombol Call\n` +
            `• ${usedPrefix}demolist → List/Selection\n` +
            `• ${usedPrefix}demomixed → Mixed Buttons\n` +
            `• ${usedPrefix}demomedia → Button + Gambar\n` +
            `• ${usedPrefix}demothumbnail → Header Thumbnail Buffer ✨\n` +
            `• ${usedPrefix}demoaudiofooter → Footer Audio ✨\n` +
            `• ${usedPrefix}democarousel → Kartu Carousel ✨\n\n` +
            `*— AIRICH (Rich Message) —*\n` +
            `• ${usedPrefix}demoaitext → Teks Markdown\n` +
            `• ${usedPrefix}demoaicode → Blok Kode\n` +
            `• ${usedPrefix}demoaitable → Tabel Data\n` +
            `• ${usedPrefix}demoaisource → Sumber/Link\n` +
            `• ${usedPrefix}demoaiimage → Gambar Tunggal\n` +
            `• ${usedPrefix}demoaiimages → Galeri Gambar\n` +
            `• ${usedPrefix}demoaiinline → Gambar Inline + Alignment ✨\n` +
            `• ${usedPrefix}demoaidynamic → GIF / Gambar Dinamis ✨\n` +
            `• ${usedPrefix}demoaimap → Peta Interaktif ✨\n` +
            `• ${usedPrefix}demoailatex → Rumus LaTeX ✨\n` +
            `• ${usedPrefix}demoaifull → Semua Sekaligus (v4.0)\n\n` +
            `_✨ = Fitur baru v4.0_`
        )
    }
}

handler.help = [
    'demoreply', 'demourl', 'democopy', 'democall', 'demolist', 'demomixed', 'demomedia',
    'demothumbnail', 'demoaudiofooter', 'democarousel',
    'demoaitext', 'demoaicode', 'demoaitable', 'demoaisource', 'demoaiimage', 'demoaiimages',
    'demoaiinline', 'demoaidynamic', 'demoaimap', 'demoailatex', 'demoaifull'
]
handler.tags  = ['tools']
handler.command = /^(demoreply|demourl|democopy|democall|demolist|demomixed|demomedia|demothumbnail|demoaudiofooter|democarousel|demoaitext|demoaicode|demoaitable|demoaisource|demoaiimage|demoaiimages|demoaiinline|demoaidynamic|demoaimap|demoailatex|demoaifull)$/i
handler.owner = true

module.exports = handler