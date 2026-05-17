const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const path = require('path');
const { MODELS } = require('../scrape/ai-router.js');

const SESSION_PATH = path.join(__dirname, 'ai-sessions.json');

let store = {};

try {
  store = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
} catch {
  store = {};
}

async function save() {
  await fsp.writeFile(SESSION_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function getSelectedModel(jid) {
  return store[jid]?.selectedModel || null;
}

async function setModel(jid, modelKey) {
  if (!store[jid]) store[jid] = {};
  store[jid].selectedModel = modelKey;
  if (MODELS[modelKey]?.needsSession && !store[jid][modelKey]) {
    store[jid][modelKey] = {
      chatId: crypto.randomUUID(),
      deviceId: crypto.randomUUID(),
    };
  }
  await save();
}

async function initModelIfNeeded(jid, modelKey) {
  if (!MODELS[modelKey]?.needsSession) return null;
  if (!store[jid]) store[jid] = {};
  if (!store[jid][modelKey]) {
    store[jid][modelKey] = {
      chatId: crypto.randomUUID(),
      deviceId: crypto.randomUUID(),
    };
    await save();
  }
  return store[jid][modelKey];
}

function getModelSession(jid, modelKey) {
  return store[jid]?.[modelKey] || null;
}

async function clearSession(jid) {
  delete store[jid];
  await save();
}

async function resetModelSession(jid, modelKey) {
  if (!store[jid]) return;
  if (MODELS[modelKey]?.needsSession) {
    store[jid][modelKey] = {
      chatId: crypto.randomUUID(),
      deviceId: crypto.randomUUID(),
    };
  }
  await save();
}

module.exports = {
  getSelectedModel,
  setModel,
  initModelIfNeeded,
  getModelSession,
  clearSession,
  resetModelSession,
};