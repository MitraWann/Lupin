const fetch = require('node-fetch'); // Pastikan node-fetch terinstall jika Node.js versi < 18

async function tiktokScraper(url) {
    try {
        const html = await fetch(url, {
            headers: {
                "authority": "www.tiktok.com",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": `"Android"`,
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
            }
        }).then(a => a.text());
        
        const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (!match) return null;
        
        const json = JSON.parse(match[1]);
        const data = json.__DEFAULT_SCOPE__["webapp.reflow.video.detail"].itemInfo.itemStruct;
        
        // Optimasi: Mengambil URL gambar pertama dari tiap slide, menghindari duplikasi
        let download = data.imagePost
            ? data.imagePost.images.map(img => img.imageURL.urlList[0])
            : await fetch(`https://www.tiktok.com/player/api/v1/items?item_ids=${data.id}`)
                  .then(a => a.json())
                  .then(b => b.items[0].video_info.url_list[0]);
                  
        return {
            id: data.id || data.aweme_id || null,
            like: data.stats.diggCount || 0,
            views: data.stats.playCount || data.play || 0,
            share: data.stats.shareCount || 0,
            comment: data.stats.commentCount || 0,
            isVideo: !data.imagePost,
            title: data.desc || data.suggestedWords?.[0] || "",
            region: data.locationCreated || null,
            duration: `${data.duration || data.music?.duration || 0} second`,
            download: download,
            author: {
                id: data.author.id || "",
                avatar: data.author?.avatarThumb,
                nickname: data.author?.nickname || "",
                username: data.author.uniqueId || "",
                followers: data.author.followerCount || 0,
                following: data.author.followingCount || 0,
                like: data.author.heartCount || 0,
                verified: data.author.verified,
                videoCount: data.author.videoCount || 0
            },
            music: {
                id: data.music?.id || null,
                title: data.music?.title || "",
                author: data.music?.authorName || "",
                thumbnail: data.music?.coverLarge || data.music?.coverMedium || data.music?.coverThumb || null,
                duration: data.music?.duration + " second" || "",
                url: data.music?.playUrl || null
            }
        };
    } catch (error) {
        console.error("Error Scraping TikTok:", error);
        return null;
    }
}

module.exports = { tiktokScraper };