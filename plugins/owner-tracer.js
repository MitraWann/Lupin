const axios = require('axios');
const util = require('util');

// Mencegah interceptor dipasang berulang kali jika plugin di-reload
if (!global.isTracerActive) {
    
    const originalConsoleError = console.error;
    
    console.error = function (...args) {
        let msg = util.format(...args);
        
        // Memonitor keyword error spesifik
        if (msg.includes('status code 401') || msg.includes('status 403') || msg.includes('Token request failed')) {
            originalConsoleError('\n🚨 [SYSTEM TRACER] MENANGKAP ERROR TERSEMBUNYI! 🚨');
            originalConsoleError('==================================================');
            originalConsoleError(msg);
            originalConsoleError('\n📍 LOKASI FILE PENYEBAB:');
            // Menghasilkan stack trace buatan untuk melihat darimana error ini berasal
            originalConsoleError(new Error().stack); 
            originalConsoleError('==================================================\n');
        }
        
        // Tetap jalankan fungsi console.error aslinya
        originalConsoleError.apply(console, args);
    };

    // Menyusup ke Axios untuk melacak URL yang mengembalikan status 401/403
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log(`\n🕵️ [AXIOS TRACER] Request gagal tertangkap!`);
                console.log(`🔗 URL Tujuan: ${error.config.url}`);
                console.log(`💢 HTTP Status: ${error.response.status}`);
            }
            return Promise.reject(error);
        }
    );

    global.isTracerActive = true;
    console.log("🕵️ [SYSTEM TRACER] Berhasil disuntikkan ke global environment.");
}

let handler = async (m, { conn }) => {
    m.reply("🕵️‍♂️ *System Tracer* telah aktif secara diam-diam.\n\nJika pesan error `401` atau `403` muncul lagi, periksa console Pterodactyl Anda. Tracer akan mencegatnya dan mencetak *URL API* serta *Nama File* yang menjadi biang keroknya.");
};

handler.help = ['tracer'];
handler.tags = ['owner'];
handler.command = /^(tracer)$/i;

// Flag keamanan
handler.owner = true;

module.exports = handler;