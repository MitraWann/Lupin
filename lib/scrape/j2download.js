const axios = require('axios');

/* @param {string} url - Tiktok, Douyin, Capcut, Threads, Instagram, Facebook, Kuaishou, QQ, Espn, Pinterest, imdb, imgur, ifunny, Izlesene, Reddit, Youtube, Twitter, Vimeo, Snapchat, Bilibili, Dailymotion, Sharechat, Likee, Linkedin, Tumblr, Hipi, Telegram, Getstickerpack, Bitchute, Febspot, 9GAG, oke.ru, Rumble, Streamable, Ted, SohuTv, Pornbox, Xvideos, Xnxx, Kuaishou, Xiaohongshu, Ixigua, Weibo, Miaopai, Meipai, Xiaoying, National Video, Yingke, Sina, Bluesky, Soundcloud, Mixcloud, Spotify, Deezer, Zingmp3, Bandcamp, Castbox, Mediafire.
*/
async function j2download(url) {
    const ua = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36';
    
    const baseHeaders = {
        'authority': 'j2download.com',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'user-agent': ua
    };
    
    try {
        const home = await axios.get('https://j2download.com', {
            headers: {
                ...baseHeaders,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'upgrade-insecure-requests': '1'
            }
        });
        
        const setCookies = home.headers['set-cookie'];
        let cookies = '';
        let csrfToken = '';
        
        if (setCookies) {
            const cookieArray = [];
            setCookies.forEach(cookie => {
                const cookiePart = cookie.split(';')[0];
                cookieArray.push(cookiePart);
                
                if (cookiePart.includes('csrf_token=')) {
                    csrfToken = cookiePart.split('csrf_token=')[1];
                }
            });
            cookies = cookieArray.join('; ');
        }
        
        const result = await axios.post('https://j2download.com/api/autolink', {
            data: { url, unlock: true }
        }, {
            headers: {
                ...baseHeaders,
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'cookie': cookies,
                'origin': 'https://j2download.com',
                'referer': 'https://j2download.com/id',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-csrf-token': csrfToken
            }
        });
        
        return result.data;
        
    } catch (err) {
        console.error('Error:', err.message);
        return null;
    }
}

module.exports = j2download;