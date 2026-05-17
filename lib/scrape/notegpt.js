const axios = require('axios');
const crypto = require('crypto');

const BASE = 'https://notegpt.io';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';

const NOTEGPT_MODELS = Object.freeze({
  gemini: {
    key: 'gemini',
    label: 'Gemini Flash Lite',
    model: 'gemini-3.1-flash-lite-preview',
    chatMode: 'standard',
    referer: `${BASE}/ai-chat`,
  },
  deepseek: {
    key: 'deepseek',
    label: 'DeepSeek V4 Flash',
    model: 'deepseek-v4-flash',
    chatMode: 'deep_think',
    referer: `${BASE}/chat-deepseek`,
  },
});

function randomNumber(length = 9) {
  let r = '';
  for (let i = 0; i < length; i++) r += Math.floor(Math.random() * 10);
  return r;
}

function makeCookie() {
  const now = Math.floor(Date.now() / 1000);
  const sbox = Buffer.from(`${now}|762|${randomNumber(9)}`).toString('base64');
  return [
    `_ga_PFX3BRW5RQ=GS2.1.s${now}$o1$g0$t${now}$j60$l0$h${randomNumber(9)}`,
    `_ga=GA1.2.${randomNumber(9)}.${now}`,
    `_gid=GA1.2.${randomNumber(9)}.${now}`,
    `_gat_gtag_UA_252982427_14=1`,
    `sbox-guid=${encodeURIComponent(sbox)}`,
    `anonymous_user_id=${crypto.randomUUID()}`,
  ].join('; ');
}

function parseSSE(raw) {
  let answer = '';
  let reasoning = '';
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const json = JSON.parse(data);
      if (json.reasoning) reasoning += json.reasoning;
      if (json.text) answer += json.text;
      if (json.done) break;
    } catch {}
  }
  return { answer, reasoning };
}

class NotegptClient {
  async ask(prompt, modelKey) {
    const config = NOTEGPT_MODELS[modelKey];
    if (!config) {
      return { success: false, error: `Model '${modelKey}' tidak dikenal di notegpt.` };
    }

    const payload = {
      message: prompt,
      language: 'auto',
      model: config.model,
      tone: 'default',
      length: 'moderate',
      conversation_id: crypto.randomUUID(),
      image_urls: [],
      history_messages: [],
      chat_mode: config.chatMode,
    };

    try {
      const res = await axios.post(`${BASE}/api/v2/chat/stream`, JSON.stringify(payload), {
        timeout: 60000,
        responseType: 'stream',
        validateStatus: () => true,
        headers: {
          'sec-ch-ua-platform': '"Android"',
          'User-Agent': UA,
          'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
          'Content-Type': 'application/json',
          'sec-ch-ua-mobile': '?1',
          'Accept': '*/*',
          'Origin': BASE,
          'sec-fetch-site': 'same-origin',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'Referer': config.referer,
          'Accept-Language': 'id-ID,id;q=0.9',
          'Cookie': makeCookie(),
          'priority': 'u=1, i',
        },
      });

      let raw = '';
      res.data.setEncoding('utf8');
      await new Promise((resolve, reject) => {
        res.data.on('data', (chunk) => { raw += chunk; });
        res.data.on('end', resolve);
        res.data.on('error', reject);
      });

      if (res.status !== 200 && res.status !== 201) {
        return { success: false, error: `HTTP ${res.status}: ${raw.slice(0, 200)}` };
      }

      const { answer, reasoning } = parseSSE(raw);

      if (!answer && !reasoning) {
        return { success: false, error: 'Response kosong dari server.', raw: raw.slice(0, 300) };
      }

      return {
        success: true,
        answer: answer || reasoning,
        model: config.model,
      };

    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { NotegptClient, NOTEGPT_MODELS };