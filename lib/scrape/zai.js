import { createHmac, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const BASE_URL = 'https://chat.z.ai';
const FE_VERSION = 'prod-fe-1.0.262';
const MODEL = 'glm-5';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const SIG_SECRET = 'key-@@@@)))()((9))-xxxx&&&%%%%%';

function buildSignature(sortedPayload, prompt, timestamp) {
    const S = Math.floor(Number(timestamp) / 300_000);
    const E = createHmac('sha256', SIG_SECRET).update(String(S)).digest('hex');
    const d = `${sortedPayload}|${Buffer.from(prompt).toString('base64')}|${timestamp}`;
    return createHmac('sha256', E).update(d).digest('hex');
}

function buildHeaders(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
        'User-Agent': UA,
        ...(token && {
            'Authorization': `Bearer ${token}`
        }),
    };
}

function buildQueryParams({ token, userId, chatId, requestId, timestamp, now }) {
    return new URLSearchParams({
        timestamp,
        requestId,
        user_id: userId,
        version: '0.0.1',
        platform: 'web',
        token,
        user_agent: UA,
        language: 'en-US',
        languages: 'en-US,id-ID,id,en',
        timezone: 'Asia/Jakarta',
        cookie_enabled: 'true',
        screen_width: '1920',
        screen_height: '1080',
        screen_resolution: '1920x1080',
        viewport_height: '900',
        viewport_width: '1920',
        viewport_size: '1920x900',
        color_depth: '24',
        pixel_ratio: '1',
        current_url: `${BASE_URL}/c/${chatId}`,
        pathname: `/c/${chatId}`,
        search: '',
        hash: '',
        host: 'chat.z.ai',
        hostname: 'chat.z.ai',
        protocol: 'https:',
        referrer: '',
        title: 'Z.ai - Free AI Chatbot & Agent powered by GLM-5 & GLM-4.7',
        timezone_offset: '-420',
        local_time: now.toISOString(),
        utc_time: now.toUTCString(),
        is_mobile: 'false',
        is_touch: 'false',
        max_touch_points: '0',
        browser_name: 'Chrome',
        os_name: 'Linux',
        signature_timestamp: timestamp,
    });
}

async function apiFetch(url, init, attempt = 1) {
    const t0 = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        const duration = +(performance.now() - t0).toFixed(2);
        return { res, duration };
    } catch (err) {
        if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            return apiFetch(url, init, attempt + 1);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

async function getGuestAuth() {
    const { res, duration } = await apiFetch(`${BASE_URL}/api/v1/auths/`, {
        method: 'GET',
        headers: buildHeaders(null),
    });

    if (!res.ok) throw new Error(`Auth failed [${res.status}]: ${await res.text()}`);
    const data = await res.json();
    
    return {
        token: data.token,
        tokenType: data.token_type,
        userId: data.id,
        userName: data.name,
        durationMs: duration,
    };
}

async function createChat(token, userPrompt) {
    const messageId = randomUUID();
    const nowSecs = Math.floor(Date.now() / 1000);
    const nowMs = Date.now();

    const payload = {
        chat: {
            id: '',
            title: 'New Chat',
            models: [MODEL],
            params: {},
            history: {
                messages: {
                    [messageId]: {
                        id: messageId,
                        parentId: null,
                        childrenIds: [],
                        role: 'user',
                        content: userPrompt,
                        timestamp: nowSecs,
                        models: [MODEL],
                    },
                },
                currentId: messageId,
            },
            tags: [],
            flags: [],
            features: [{ type: 'tool_selector', server: 'tool_selector_h', status: 'hidden' }],
            mcp_servers: [],
            enable_thinking: true,
            auto_web_search: false,
            message_version: 1,
            extra: {},
            timestamp: nowMs,
        },
    };

    const { res, duration } = await apiFetch(`${BASE_URL}/api/v1/chats/new`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Chat failed [${res.status}]: ${await res.text()}`);
    const data = await res.json();
    
    return {
        chatId: data.id,
        title: data.title,
        messageId,
        durationMs: duration,
    };
}

async function parseSSE(body) {
    const decoder = new TextDecoder();
    let buffer = '';
    const thinking = [];
    const answer = [];
    let done = false;

    // Menangani stream chunk dari native web fetch 
    for await (const chunk of body) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6).trim();
            if (jsonStr === '[DONE]') {
                done = true;
                continue;
            }

            let parsed;
            try { parsed = JSON.parse(jsonStr); } catch { continue; }

            if (parsed.type !== 'chat:completion' || !parsed.data) continue;

            const { delta_content, phase, done: d } = parsed.data;
            if (d) done = true;
            if (!delta_content) continue;

            if (phase === 'thinking') thinking.push(delta_content);
            else if (phase === 'answer') answer.push(delta_content);
        }
    }

    return {
        thinking: thinking.join(''),
        answer: answer.join(''),
        done
    };
}

async function streamCompletion(auth, chatMeta, userPrompt) {
    const { token, userId, userName } = auth;
    const { chatId, messageId } = chatMeta;
    const now = new Date();
    const ts = String(Date.now());
    const requestId = randomUUID();

    const sigI = { timestamp: ts, requestId, user_id: userId };
    const sortedPayload = Object.entries(sigI).sort((a, b) => a[0].localeCompare(b[0])).join(',');
    const signature = buildSignature(sortedPayload, userPrompt, ts);

    const qp = buildQueryParams({ token, userId, chatId, requestId, timestamp: ts, now });
    const url = `${BASE_URL}/api/v2/chat/completions?${qp.toString()}`;

    const reqBody = {
        stream: true,
        model: MODEL,
        messages: [{ role: 'user', content: userPrompt }],
        signature_prompt: userPrompt,
        params: {},
        extra: {},
        features: {
            image_generation: false,
            web_search: false,
            auto_web_search: false,
            preview_mode: true,
            flags: [],
            enable_thinking: true,
        },
        variables: {
            '{{USER_NAME}}': userName,
            '{{USER_LOCATION}}': 'Unknown',
            '{{CURRENT_DATETIME}}': now.toISOString().replace('T', ' ').slice(0, 19),
            '{{CURRENT_TIMEZONE}}': 'Asia/Jakarta',
            '{{USER_LANGUAGE}}': 'en-US',
        },
        chat_id: chatId,
        id: requestId,
        current_user_message_id: messageId,
        current_user_message_parent_id: null,
        background_tasks: { title_generation: true, tags_generation: true },
    };

    const { res } = await apiFetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept-Language': 'en-US',
            'X-FE-Version': FE_VERSION,
            'X-Signature': signature,
        },
        body: JSON.stringify(reqBody),
    });

    if (!res.ok) throw new Error(`Completion failed [${res.status}]: ${await res.text()}`);

    return await parseSSE(res.body);
}

export async function chatZai(prompt) {
    try {
        const auth = await getGuestAuth();
        const chatMeta = await createChat(auth.token, prompt);
        const comp = await streamCompletion(auth, chatMeta, prompt);
        return {
            status: true,
            thinking: comp.thinking,
            answer: comp.answer
        };
    } catch (e) {
        return { status: false, message: e.message };
    }
}