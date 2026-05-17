const { OverchatClient } = require('./overchat.js');
const { NotegptClient } = require('./notegpt.js');

const MODELS = Object.freeze({
  claude: {
    key: 'claude',
    label: 'Claude Haiku 4.5',
    provider: 'overchat',
    needsSession: true,
  },
  gpt4o: {
    key: 'gpt4o',
    label: 'GPT-4o',
    provider: 'overchat',
    needsSession: true,
  },
  qwen: {
    key: 'qwen',
    label: 'Qwen3 80B',
    provider: 'overchat',
    needsSession: true,
  },
  gemini: {
    key: 'gemini',
    label: 'Gemini Flash Lite',
    provider: 'notegpt',
    needsSession: false,
  },
  deepseek: {
    key: 'deepseek',
    label: 'DeepSeek V4 (Thinking)',
    provider: 'notegpt',
    needsSession: false,
  },
});

const overchat = new OverchatClient();
const notegpt = new NotegptClient();

async function ask(prompt, modelKey, sessionData = null) {
  const config = MODELS[modelKey];
  if (!config) {
    return { success: false, error: `Model '${modelKey}' tidak dikenal.` };
  }

  if (config.provider === 'overchat') {
    if (!sessionData?.chatId || !sessionData?.deviceId) {
      return { success: false, error: 'Session overchat tidak tersedia.' };
    }
    return overchat.ask(prompt, sessionData.chatId, sessionData.deviceId, modelKey);
  }

  if (config.provider === 'notegpt') {
    return notegpt.ask(prompt, modelKey);
  }

  return { success: false, error: 'Provider tidak dikenal.' };
}

module.exports = { ask, MODELS };