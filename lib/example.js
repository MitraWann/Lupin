/**
 * MessageBuilder v4.1 - Complete Usage Examples
 * Dokumentasi lengkap dengan contoh penggunaan untuk setiap fitur
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. BASIC USAGE - TOMBOL INTERAKTIF
// ═══════════════════════════════════════════════════════════════════════════

const { Button, ValidationError } = require('./MessageBuilder')

// Contoh 1: Tombol Reply Sederhana
async function example1_simpleReplyButtons(jid, conn) {
    try {
        const msg = new Button()
            .setBody('Pilih pilihan Anda:')
            .setFooter('Dibuat dengan MessageBuilder v4.1')
            .addReply('Opsi 1', 'opt_1')
            .addReply('Opsi 2', 'opt_2')
            .addReply('Opsi 3', 'opt_3')

        await msg.run(jid, conn, null, { timeout: 30000, retry: 3 })
        console.log('✅ Simple reply buttons sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 2: Tombol dengan Header Gambar
async function example2_buttonWithImage(jid, conn) {
    try {
        const msg = new Button()
            .setImage('https://via.placeholder.com/300x200')
            .setTitle('Produk Premium')
            .setSubtitle('Limited Offer')
            .setBody('Dapatkan diskon 50% hari ini!')
            .setFooter('Penawaran terbatas')
            .addReply('Beli Sekarang', 'buy_premium')
            .addUrl('Lihat Detail', 'https://example.com/product')

        await msg.run(jid, conn)
        console.log('✅ Button with image sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 3: Tombol dengan Thumbnail dari Buffer
async function example3_buttonWithThumbnail(jid, conn) {
    const fs = require('fs')

    try {
        const imageBuffer = fs.readFileSync('./thumbnail.jpg')

        const msg = new Button()
            .setThumbnail(imageBuffer) // Langsung dari Buffer
            .setTitle('Notifikasi Penting')
            .setBody('Klik untuk melihat detail')
            .addReply('Tunjukkan Detail', 'show_detail')
            .addCall('Hubungi Kami', '1234567890')

        await msg.run(jid, conn)
        console.log('✅ Button with thumbnail sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 4: Tombol dengan Copy & URL
async function example4_buttonWithCopyAndUrl(jid, conn) {
    try {
        const msg = new Button()
            .setBody('Gunakan kode promo kami:')
            .addCopy('Salin Kode', 'PROMO2024', 'promo_code')
            .addUrl('Terapkan', 'https://example.com/checkout')

        await msg.run(jid, conn, null, { timeout: 15000 })
        console.log('✅ Copy & URL buttons sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 5: List Selection dengan Multiple Sections
async function example5_listSelection(jid, conn) {
    try {
        const msg = new Button()
            .setBody('Pilih kategori produk:')
            .setFooter('Tekan untuk membuka list')
            .addSelection('Pilih Kategori')

        // Section 1: Elektronik
        msg.makeSections('📱 Elektronik')
            .makeRow('', 'Smartphone', 'Ponsel terbaru', 'cat_smartphone')
            .makeRow('', 'Laptop', 'Komputer laptop', 'cat_laptop')
            .makeRow('', 'Tablet', 'Perangkat tablet', 'cat_tablet')

        // Section 2: Fashion
        msg.makeSections('👗 Fashion')
            .makeRow('', 'Pakaian', 'Koleksi pakaian', 'cat_clothes')
            .makeRow('', 'Sepatu', 'Berbagai sepatu', 'cat_shoes')
            .makeRow('', 'Aksesori', 'Barang aksesori', 'cat_accessories')

        // Section 3: Makanan
        msg.makeSections('🍔 Makanan')
            .makeRow('', 'Makanan Cepat Saji', 'Menu cepat saji', 'cat_fastfood')
            .makeRow('', 'Kue & Dessert', 'Kue dan dessert', 'cat_dessert')

        await msg.run(jid, conn)
        console.log('✅ List selection sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. CAROUSEL USAGE
// ═══════════════════════════════════════════════════════════════════════════

const { Carousel } = require('./MessageBuilder')

// Contoh 6: Carousel dengan Multiple Cards
async function example6_carousel(jid, conn) {
    try {
        // Card 1
        const card1 = new Carousel()
            .setId('card_1')
            .setTitle('iPhone 15 Pro')
            .setSubtitle('Apple')
            .setBody('Rp 15.999.000\nProsessor A17 Pro')
            .setImage('https://via.placeholder.com/250x200?text=iPhone+15')
            .addReply('Beli Sekarang', 'buy_iphone15')
            .addUrl('Lihat Spek', 'https://example.com/iphone15')
            .setMetadata({ rating: 4.8, reviews: 1250 })

        // Card 2
        const card2 = new Carousel()
            .setId('card_2')
            .setTitle('Samsung Galaxy S24')
            .setSubtitle('Samsung')
            .setBody('Rp 13.499.000\nDisplay 6.8 inci AMOLED')
            .setImage('https://via.placeholder.com/250x200?text=Galaxy+S24')
            .addReply('Beli Sekarang', 'buy_s24')
            .addUrl('Lihat Spek', 'https://example.com/s24')
            .setMetadata({ rating: 4.7, reviews: 980 })

        // Card 3
        const card3 = new Carousel()
            .setId('card_3')
            .setTitle('Google Pixel 8')
            .setSubtitle('Google')
            .setBody('Rp 9.999.000\nTensorFlow AI Camera')
            .setImage('https://via.placeholder.com/250x200?text=Pixel+8')
            .addReply('Beli Sekarang', 'buy_pixel8')
            .addUrl('Lihat Spek', 'https://example.com/pixel8')
            .setMetadata({ rating: 4.9, reviews: 1100 })

        // Main button dengan carousel
        const msg = new Button()
            .setBody('🔥 Pilih smartphone favorit Anda:')
            .setFooter('Geser ke kiri untuk melihat lebih banyak')
            .addCarousel(card1, 'hscroll')
            .addCarousel(card2, 'hscroll')
            .addCarousel(card3, 'hscroll')
            .setTrackingId('carousel_smartphones_001')
            .setAnalytics({
                source: 'auto',
                campaign: 'smartphone_promo'
            })

        await msg.run(jid, conn, null, { timeout: 20000 })
        console.log('✅ Carousel sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. AIRICH USAGE - RICH TEXT RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

const { AIRich } = require('./MessageBuilder')

// Contoh 7: AIRich dengan Text dan Code
async function example7_airichCode(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Berikut adalah contoh kode JavaScript:\n')
            .addCode('javascript', `
function greet(name) {
    console.log(\`Halo, \${name}!\`)
    return 'Greeting sent!'
}

greet('World')
            `.trim())

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with code sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 8: AIRich dengan Table
async function example8_airichTable(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Tabel Data Kualitas Produk:')
            .addTable([
                ['Produk', 'Rating', 'Penjualan', 'Status'],
                ['iPhone 15', '⭐⭐⭐⭐⭐', '5000+', '✅ Ready'],
                ['Samsung S24', '⭐⭐⭐⭐', '3500+', '✅ Ready'],
                ['Google Pixel 8', '⭐⭐⭐⭐⭐', '2800+', '✅ Ready']
            ])

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with table sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 9: AIRich dengan Multiple Images
async function example9_airichImages(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Galeri Produk Terbaru:')
            .addImage([
                'https://via.placeholder.com/300x200?text=Produk+1',
                'https://via.placeholder.com/300x200?text=Produk+2',
                'https://via.placeholder.com/300x200?text=Produk+3'
            ])

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with images sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 10: AIRich dengan Inline Image
async function example10_airichInlineImage(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Lihat gambar produk kami:')
            .addInlineImage('https://via.placeholder.com/400x300?text=Produk', {
                imageText: 'Produk eksklusif kami',
                alignment: 'center',
                tapLinkUrl: 'https://example.com/product'
            })
            .addText('\nKlik gambar untuk melihat detail lengkap!')

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with inline image sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 11: AIRich dengan Map
async function example11_airichMap(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Lokasi Toko Kami:')
            .addMap(
                {
                    latitude: -6.2088,
                    longitude: 106.8456,
                    latDelta: 0.05,
                    lngDelta: 0.05
                },
                [
                    {
                        lat: -6.2088,
                        lng: 106.8456,
                        title: 'Toko Pusat Jakarta',
                        body: 'Jl. Sudirman No. 1, Jakarta'
                    },
                    {
                        lat: -6.1751,
                        lng: 106.8249,
                        title: 'Cabang Senayan',
                        body: 'Kompleks Senayan, Jakarta'
                    }
                ]
            )

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with map sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 12: AIRich dengan Dynamic Media (GIF)
async function example12_airichDynamic(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Animasi Produk:')
            .addDynamic(
                'https://media.giphy.com/media/example.gif',
                'gif',
                3 // Loop 3 kali
            )

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with dynamic media sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// Contoh 13: AIRich dengan LaTeX
async function example13_airichLatex(chat, conn) {
    try {
        const aiRich = new AIRich()
            .addText('Rumus Matematika:')
            .addLatex('Luas lingkaran dengan radius r:', [
                {
                    latex: 'A = \\pi r^2',
                    url: 'https://latex.codecogs.com/png.image?A%20%3D%20%5Cpi%20r%5E2',
                    width: 150,
                    height: 50
                }
            ])
            .addText('\nUntuk lingkaran dengan r = 5:')
            .addLatex('', [
                {
                    latex: 'A = \\pi \\times 5^2 = 25\\pi \\approx 78.54',
                    url: 'https://latex.codecogs.com/png.image?A%20%3D%20%5Cpi%20%5Ctimes%205%5E2%20%3D%2025%5Cpi%20%5Capprox%2078.54',
                    width: 280,
                    height: 60
                }
            ])

        await aiRich.run(chat, conn)
        console.log('✅ AIRich with LaTeX sent')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. ERROR HANDLING EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

// Contoh 14: Error Handling dengan Try-Catch
async function example14_errorHandling(jid, conn) {
    try {
        const msg = new Button()
            // .setBody('') // Error: Body kosong
            .setBody('Valid body')
            // .addUrl('Button', 'invalid-url') // Error: Invalid URL
            .addUrl('Google', 'https://google.com')

        await msg.run(jid, conn, null, {
            timeout: 5000,
            retry: 2
        })
    } catch (err) {
        if (err instanceof ValidationError) {
            console.error('🔴 Validation Error:', err.message)
            // Handle validation error
        } else if (err.isOperationalError) {
            console.error('🟠 Operational Error:', err.message)
            // Handle operational error (timeout, network, etc)
        } else {
            console.error('⚫ Unknown Error:', err.message)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADVANCED TRACKING & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

// Contoh 15: Message dengan Tracking & Analytics
async function example15_trackingAnalytics(jid, conn) {
    try {
        const campaignId = 'summer_sale_2024_' + Date.now()

        const msg = new Button()
            .setBody('🌞 Penawaran Musim Panas!')
            .setFooter('Jangan lewatkan kesempatan ini')
            .addReply('Lihat Promo', 'view_promo')
            .addUrl('Belanja Sekarang', 'https://example.com/summer-sale')

            // [v4.1] Tracking & Analytics
            .setTrackingId(campaignId)
            .setAnalytics({
                source: 'whatsapp_bot',
                campaign: 'summer_sale_2024',
                customData: {
                    targetAudience: 'premium_members',
                    discountPercentage: 50,
                    validUntil: '2024-08-31'
                }
            })
            .setMetadata({
                messageVersion: '1.0',
                createdBy: 'marketing_team',
                approvedBy: 'admin'
            })

        await msg.run(jid, conn, null, {
            timeout: 30000,
            retry: 3
        })

        console.log('✅ Message with tracking sent')
        console.log('📊 Tracking ID:', campaignId)
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. COMBINED EXAMPLE - COMPLETE WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

async function example16_completeWorkflow(jid, conn) {
    try {
        console.log('📋 Starting complete workflow...\n')

        // Step 1: Send greeting with buttons
        console.log('Step 1: Sending greeting...')
        const greeting = new Button()
            .setBody('Selamat datang! Apa yang ingin Anda lakukan?')
            .addReply('Belanja', 'action_shop')
            .addReply('Bantuan', 'action_help')
            .addReply('Kontak', 'action_contact')

        await greeting.run(jid, conn, null, { timeout: 15000 })

        // Step 2: Send product carousel
        console.log('Step 2: Sending products...')
        const card1 = new Carousel()
            .setTitle('Produk A')
            .setBody('Rp 50.000')
            .setImage('https://via.placeholder.com/250x200?text=Produk+A')
            .addReply('Beli', 'buy_a')

        const productMsg = new Button()
            .setBody('Pilih produk:')
            .addCarousel(card1)
            .setTrackingId('workflow_' + Date.now())

        await productMsg.run(jid, conn, null, { timeout: 15000 })

        // Step 3: Send information
        console.log('Step 3: Sending information...')
        const aiRich = new AIRich()
            .addText('ℹ️ Informasi Pengiriman:\n')
            .addTable([
                ['Metode', 'Waktu', 'Biaya'],
                ['Regular', '3-5 hari', 'Rp 10.000'],
                ['Express', '1-2 hari', 'Rp 25.000']
            ])

        await aiRich.run(jid, conn)

        console.log('\n✅ Complete workflow finished!')
    } catch (err) {
        console.error('❌ Workflow error:', err.message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const {
    createButton,
    createCarousel,
    createAIRich,
    CAROUSEL_TYPES,
    MESSAGE_TYPES
} = require('./MessageBuilder')

// Contoh 17: Menggunakan Factory Functions
async function example17_factoryFunctions(jid, conn) {
    try {
        // Menggunakan factory
        const msg = createButton()
            .setBody('Menggunakan factory function')
            .addReply('Opsi 1', 'opt_1')

        await msg.run(jid, conn)
        console.log('✅ Using factory function')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    example1_simpleReplyButtons,
    example2_buttonWithImage,
    example3_buttonWithThumbnail,
    example4_buttonWithCopyAndUrl,
    example5_listSelection,
    example6_carousel,
    example7_airichCode,
    example8_airichTable,
    example9_airichImages,
    example10_airichInlineImage,
    example11_airichMap,
    example12_airichDynamic,
    example13_airichLatex,
    example14_errorHandling,
    example15_trackingAnalytics,
    example16_completeWorkflow,
    example17_factoryFunctions
}
