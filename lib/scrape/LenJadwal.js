const axios = require('axios');
const cheerio = require('cheerio');

async function LenJadwal() {
    try {
        const { data } = await axios.get('https://www.bola.net/jadwal-pertandingan/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        let hasil = [];

        // Berdasarkan struktur jadwal.html yang Boss kirim
        $('.box-content').each(function () {
            let tanggal = $(this).find('h3').text().trim();
            
            if (tanggal && !tanggal.toLowerCase().includes('pencarian')) {
                let pertandingan = [];
                $(this).find('ul li').each(function () {
                    let info = $(this).text().trim().replace(/\s+/g, ' ');
                    if (info) pertandingan.push(info);
                });

                if (pertandingan.length > 0) {
                    hasil.push({
                        tanggal: tanggal,
                        list: pertandingan
                    });
                }
            }
        });
        return hasil;
    } catch (e) {
        console.error(e);
        return null;
    }
}

module.exports = LenJadwal;