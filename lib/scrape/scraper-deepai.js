/**
 * TULIPNEX HELPER / LIBRARY
 * Location: ./lib/scraper-deepai.js
 * Feature: DeepAI Wrapper (Claude Model) with Session Manager
 */

const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");

// Daftar User-Agent untuk bypass proteksi
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
];

// Map untuk menyimpan riwayat obrolan masing-masing user
const sessions = new Map();

function getUA() {
  return UAS[Math.floor(Math.random() * UAS.length)];
}

function getHeaders(form) {
  return {
    ...form.getHeaders(),
    "api-key": "tryit-61180926040-f45718959fea9f0a04999506c579a399",
    "user-agent": getUA(),
    "origin": "https://deepai.org",
    "referer": "https://deepai.org/",
    "accept": "*/*",
    "accept-language": Math.random() > 0.5 ? "en-US,en;q=0.9" : "id-ID,id;q=0.9,en;q=0.8",
    "sec-ch-ua": `"Chromium";v="${130 + Math.floor(Math.random() * 5)}", "Not:A-Brand";v="24"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"Windows"`,
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty"
  };
}

async function sendChat(message, session) {
  const form = new FormData();
  form.append("chat_style", "claudeai_0");
  form.append("chatHistory", JSON.stringify(session.history));
  form.append("model", "standard");
  form.append("session_uuid", session.id);
  form.append("sensitivity_request_id", uuidv4());
  form.append("hacker_is_stinky", "very_stinky");
  form.append("enabled_tools", JSON.stringify(["image_generator", "image_editor"]));

  const { data } = await axios.post(
    "https://api.deepai.org/hacking_is_a_serious_crime",
    form,
    {
      headers: getHeaders(form),
      timeout: 20000,
      validateStatus: () => true
    }
  );

  if (!data) throw new Error("No response from DeepAI API");
  return data;
}

// Mengambil atau membuat sesi baru untuk user tertentu
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, { id: uuidv4(), history: [] });
  }
  return sessions.get(userId);
}

// Menghapus sesi user (untuk reset memori)
function clearSession(userId) {
  sessions.delete(userId);
}

// Fungsi utama yang akan dipanggil oleh plugin
async function chat(userId, text) {
  const session = getSession(userId);
  session.history.push({ role: "user", content: text });

  let res, err;
  
  // Fitur Retry jika rate-limit atau gagal
  for (let i = 0; i < 3; i++) {
    try {
      res = await sendChat(text, session);
      break; 
    } catch (e) {
      err = e;
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000)); // Jeda 1.5s - 3.5s
    }
  }

  if (!res) throw err;

  let reply = "";
  if (typeof res === "string") reply = res;
  else if (res.output) reply = res.output;
  else if (res.response) reply = res.response;
  else reply = JSON.stringify(res);

  // Simpan balasan AI ke memori
  session.history.push({ role: "assistant", content: reply });

  return reply;
}

module.exports = { chat, clearSession };