const https = require('https');
const zlib = require('zlib');

/**
 * [!] PENTING: Masukkan Cookie Anda di sini.
 * Anda bisa mengambilnya dari tab Network > Request Headers saat mengakses kimi.com
 */
const RAW_COOKIES = [
    { 
        name: 'kimi-auth', 
        value: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTc4MDU2ODMzOCwiaWF0IjoxNzc3OTc2MzM4LCJqdGkiOiJkN3NzODRoZzZpOHFiZG11MWs1MCIsInR5cCI6ImFjY2VzcyIsImFwcF9pZCI6ImtpbWkiLCJzdWIiOiJkN3NzODQ5ZzZpOHFiZG11MWswZyIsInNwYWNlX2lkIjoiZDdzczg0OWc2aThxYmRtdTFjOGciLCJhYnN0cmFjdF91c2VyX2lkIjoiZDdzczg0OWc2aThxYmRtdTFjODAiLCJkZXZpY2VfaWQiOiI3NjM2MzQ5NjgzNjA2MDQ4NTIzIiwicmVnaW9uIjoib3ZlcnNlYXMiLCJtZW1iZXJzaGlwIjp7ImxldmVsIjoxMH19.HrwOpnOKOPJxByMz5HnQfDYB8i2SVy5bdFkZRznucQROt9nVWU72aSd84EkyK6JSPQ6v5l2K1LT2FtDIpbxUHg' 
    }
];

function getAuthData() {
    if (RAW_COOKIES.length === 0) {
        return { cookieStr: '', token: '' };
    }
    const cookieStr = RAW_COOKIES.map(c => `${c.name}=${c.value}`).join('; ');
    const authCookie = RAW_COOKIES.find(c => c.name === 'kimi-auth');
    return { 
        cookieStr, 
        token: authCookie ? authCookie.value : '' 
    };
}

const { cookieStr: COOKIE_STR, token: TOKEN } = getAuthData();

const BASE_HEADERS = {
    'Authorization': `Bearer ${TOKEN}`,
    'Cookie': COOKIE_STR,
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': 'https://www.kimi.com',
    'Referer': 'https://www.kimi.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'R-Timezone': 'Asia/Makassar',
    'X-Language': 'en-US',
    'X-Traffic-Id': 'd2dbe15eik6joqg7ircg',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
};

// Encode Connect RPC payload
function encodeConnectJson(obj) {
    const body = Buffer.from(JSON.stringify(obj), 'utf8');
    const frame = Buffer.alloc(5 + body.length);
    frame[0] = 0x00;
    frame.writeUInt32BE(body.length, 1);
    body.copy(frame, 5);
    return frame;
}

// Decode Connect RPC payload streams
function decodeConnectFrames(buffer) {
    const frames = [];
    let offset = 0;
    while (offset + 5 <= buffer.length) {
        const len = buffer.readUInt32BE(offset + 1);
        offset += 5;
        if (offset + len > buffer.length) break;
        const chunk = buffer.slice(offset, offset + len);
        offset += len;
        try {
            frames.push(JSON.parse(chunk.toString('utf8')));
        } catch {}
    }
    return frames;
}

// Decompression handler
function decompress(buf, encoding) {
    return new Promise((resolve, reject) => {
        if (encoding === 'gzip') {
            zlib.gunzip(buf, (err, r) => err ? reject(err) : resolve(r));
        } else if (encoding === 'deflate') {
            zlib.inflate(buf, (err, r) => err ? reject(err) : resolve(r));
        } else if (encoding === 'br') {
            zlib.brotliDecompress(buf, (err, r) => err ? reject(err) : resolve(r));
        } else {
            resolve(buf);
        }
    });
}

// Core HTTPS Request
function request(path, body, extraHeaders) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'www.kimi.com',
            port: 443,
            path,
            method: 'POST',
            headers: {
                ...BASE_HEADERS,
                ...extraHeaders,
                'Content-Length': String(body.length),
            },
        }, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', async () => {
                try {
                    const decompressed = await decompress(Buffer.concat(chunks), res.headers['content-encoding']);
                    resolve({ status: res.statusCode, headers: res.headers, body: decompressed });
                } catch (err) {
                    reject(err);
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

/**
 * Chat dengan Kimi AI
 * @param {String} query Pertanyaan user
 * @param {String} chatId ID Obrolan sebelumnya (opsional)
 */
async function kimiai(query, chatId = null) {
    if (!TOKEN) throw new Error('Konfigurasi Cookie Kimi AI (kimi-auth) belum diisi di lib/scraper-kimi.js');

    const payload = {
        scenario: 'SCENARIO_K2D5',
        tools: [{ type: 'TOOL_TYPE_SEARCH', search: {} }],
        message: {
            role: 'user',
            blocks: [{ message_id: '', text: { content: query } }],
        },
        options: { thinking: false },
    };

    if (chatId) payload.chat_id = chatId;

    const body = encodeConnectJson(payload);
    const res = await request(
        '/apiv2/kimi.gateway.chat.v1.ChatService/Chat',
        body,
        { 'Content-Type': 'application/connect+json', 'Accept': '*/*' }
    );

    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.body.toString()}`);

    const frames = decodeConnectFrames(res.body);
    let text = '';
    let newChatId = chatId;

    for (const frame of frames) {
        if (frame.chat?.id) newChatId = frame.chat.id;
        if (frame.op === 'set' && frame.mask === 'block.exception') {
            throw new Error(`Kimi exception: ${JSON.stringify(frame.block?.exception)}`);
        }
        if (frame.op === 'set' && frame.mask === 'block.text') {
            if (frame.block?.text?.content) text = frame.block.text.content;
        } else if (frame.op === 'append' && frame.mask === 'block.text.content') {
            if (frame.block?.text?.content) text += frame.block.text.content;
        }
    }

    return { chatId: newChatId, text, frames };
}

/**
 * Mendapatkan riwayat chat Kimi
 */
async function listChats(pageSize = 5, query = '') {
    if (!TOKEN) throw new Error('Konfigurasi Cookie Kimi AI (kimi-auth) belum diisi di lib/scraper-kimi.js');

    const body = Buffer.from(JSON.stringify({ project_id: '', page_size: pageSize, query }), 'utf8');
    const res = await request(
        '/apiv2/kimi.chat.v1.ChatService/ListChats',
        body,
        { 'Content-Type': 'application/json', 'Accept': '*/*' }
    );

    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.body.toString()}`);

    return JSON.parse(res.body.toString('utf8'));
}

module.exports = { kimiai, listChats };