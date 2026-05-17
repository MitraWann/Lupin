const axios = require('axios');
const crypto = require('crypto');

const API = 'https://api.overchat.ai/v1/chat/completions';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';

const MODELS = Object.freeze({
  claude: {
    key: 'claude',
    label: 'Claude Haiku 4.5',
    model: 'claude-haiku-4-5-20251001',
    personaId: 'claude-haiku-4-5-landing',
  },
  gpt4o: {
    key: 'gpt4o',
    label: 'GPT-4o',
    model: 'openai/gpt-4o',
    personaId: 'gpt-4o-landing',
  },
  qwen: {
    key: 'qwen',
    label: 'Qwen3 80B',
    model: 'alibaba/qwen3-next-80b-a3b-instruct',
    personaId: 'qwen-3-landing',
  },
});

function buildHeaders(deviceId) {
  return {
    'sec-ch-ua-platform': '"Android"',
    'x-device-uuid': deviceId,
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?1',
    'x-device-language': 'id-ID',
    'x-device-platform': 'web',
    'x-device-version': '1.0.44',
    'user-agent': UA,
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://overchat.ai',
    'referer': 'https://overchat.ai/',
    'accept-language': 'id-ID,id;q=0.9',
    'priority': 'u=1, i',
  };
}

function parseSSE(raw) {
  let answer = '';
  let model = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const json = JSON.parse(data);
      if (json.model) model = json.model;
      const content = json.choices?.[0]?.delta?.content;
      if (typeof content === 'string') answer += content;
    } catch {}
  }

  return { answer, model };
}

class OverchatClient {
  async ask(prompt, chatId, deviceId, modelKey) {
    const config = MODELS[modelKey];
    if (!config) {
      return { success: false, error: `Model '${modelKey}' tidak dikenal.` };
    }

    const body = {
      chatId,
      model: config.model,
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
        },
      ],
      personaId: config.personaId,
      frequency_penalty: 0,
      max_tokens: 4000,
      presence_penalty: 0,
      stream: true,
      temperature: 0.7,
      top_p: 0.95,
    };

    try {
      const res = await axios.post(API, JSON.stringify(body), {
        timeout: 30000,
        responseType: 'stream',
        validateStatus: () => true,
        headers: buildHeaders(deviceId),
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

      const { answer, model } = parseSSE(raw);

      if (!answer) {
        return { success: false, error: 'Response kosong dari server.', raw: raw.slice(0, 300) };
      }

      return { success: true, answer, model: model || config.model };

    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { OverchatClient, MODELS };