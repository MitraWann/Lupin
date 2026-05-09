/*
@ author: Herza
@ modification: Ditambahkan dukungan "Memory/Session" oleh Developer
@ type : CommonJS
*/

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Data hasil RESCUE dari RAM (Memori)
const COOKIE_STRING = `_fbp=fb.1.1774521245673.21299098850612656; anthropic-device-id=accab026-f4a6-4392-bca5-3688d765e55e; activitySessionId=9aa25a05-9762-4c4d-92d0-c6829f36aafc; ajs_anonymous_id=claudeai.v1.e0dbc73c-3f15-4697-96c0-8c202e94baaf; CH-prefers-color-scheme=dark; _cfuvid=0TywecwxmfHzkN7y2G9pdueK77YVLiF3Wnb_pQcPEz8-1774521253299-0.0.1.1-604800000; __ssid=b0844149-eab2-452b-9271-21a8002193b2; g_state={"i_l":0,"i_ll":1774521260160,"i_e":{"enable_itp_optimization":0}}; sessionKey=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; lastActiveOrg=b0d0ee2d-c634-4a9d-bda0-10b92e3cc054; intercom-device-id-lupk8zyo=38437c42-96fa-4919-b775-33e659916617; ajs_user_id=56118c22-df19-4b4c-898a-966ce41bc120; _gcl_au=1.1.23647109.1774521260.1863092462.1774521314.1774521401; routingHint=sk-ant-rh-eyJ0eXAiOiAiSldUIiwgImFsZyI6ICJFUzI1NiIsICJraWQiOiAiN0MxcWFPRnhqdWxaUjRFQnNuNk1UeUZGNWdDV2JHbFpNVDR2RklrRFFpbyJ9.eyJzdWIiOiAiNTYxMThjMjItZGYxOS00YjRjLTg5OGEtOTY2Y2U0MWJjMTIwIiwgImlhdCI6IDE3NzQ1MjYwNDcsICJpc3MiOiAiY2xhdWRlLWFpLXJvdXRpbmciLCAib25ib2FyZGluZ19jb21wbGV0ZSI6IHRydWUsICJwaG9uZV92ZXJpZmllZCI6IHRydWUsICJhZ2VfdmVyaWZpZWQiOiB0cnVlLCAibmFtZSI6ICJUdWxpcE5leCJ9.EnPB8xMi4aL636n_Nauv763XE28nMWwPzy_ZZmxTXlkmeE5ZeNJevcN0IYkh7j_Rsl82r0qp4w956ET7zcvKAA; cf_clearance=zxyeSW6VA1yhVpAK4n2dDNkv79oceSRx7WE.LEIr6KM-1774526055-1.2.1.1-o7QR_.nZeTFW5FgiD_T1etidY1zHZ.9e4LFJYVirOMjTXvci8zMPrSwZuaNGyc9HeN9w38tmKfUjMFMRIvg0blXjN_5rT7BSTTPLT_p91_fPO1X8mObSscC8QVk1vFq7jLQVhCkAvVfi4_zYDaDiatrL8xbcyy_jHcyK9s7KD7BxSVXCceq0lFo7vx39hHInQM8k7QhHRZx88tJcHP1uSb6FScobJhES0wMKuj0RULY; intercom-session-lupk8zyo=eVEzMFZtSk9MSGNmTkkrOVlyVEF0aFRwZ2RRT3lOeUtzRXRYZnJYUVgzcG5pUHB4NERUbFVKZks5aUtXUjMway81OHkxTXBtMzNLWWV3SS9TaUMxTmZqLzN6aWpnVFJ4M0hONXlKMHdNemREYXJsTnlHemFGM29PR1FqdEI5UnZQWjlhVUxpcVcxZy9OMTJPalp4dm1TY1dVc05JV09ST3BiSXAzSTJGQ1J0K2lUQnNkNzdFOExMTEE2U2gvK1c0cGpHK2JBaE5UeEp3cXZWd1EwbHQ5Y0Vhb3NtRFlCbVU0cUxDaFBJRm96WnhmQlJJb0YzL3NFalo1aGhVQVBhMVJNcEJmaVJsVVNZRCtBR24yVmhHNXB5S2VjMy82NUR5RVZaOG5qaCtZcW89LS0zYnFhbWI1RDRhdHh0RkczaEZaM2J3PT0=--46cde2ba1083d01ab6fea37bb28697024d62fe3a; user-sidebar-visible-on-load=false; __cf_bm=9ahFBqnTlsr2NfuUzjxsLfsVcV0k02ixsqAJu3uFM2k-1774527135-1.0.1.1-4zJnyXijm77_ES.VpbFEYO1ku1fKOj5CZPNCNvFDjhhXrvV71SAQ6VxaC2BIBvKRvRRNl3vP5E5jrvGflfRmPYrOZHF4IaBJd3NirJue9E8; _dd_s=aid=75754084-85bf-4758-99d9-5545eae50858&rum=2&id=133fe132-0a00-40ac-993f-740cf150036b&created=1774524189881&expire=1774528089702`;

const ORG_ID = "b0d0ee2d-c634-4a9d-bda0-10b92e3cc054";
const MODEL = "claude-sonnet-4-6";
const DEVICE_ID = "accab026-f4a6-4392-bca5-3688d765e55e";
const ANON_ID = "claudeai.v1.e0dbc73c-3f15-4697-96c0-8c202e94baaf";

const MAX_IMAGES = 2;
const MAX_PROMPT = 2500;

const BASE_HEADERS = {
  "accept": "*/*",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "en-US,en;q=0.9",
  "anthropic-anonymous-id": ANON_ID,
  "anthropic-client-platform": "web_claude_ai",
  "anthropic-client-sha": "456b13de6bf5c5013fd09fbfc657137b90de112a",
  "anthropic-client-version": "1.0.0",
  "anthropic-device-id": DEVICE_ID,
  "cache-control": "no-cache",
  "cookie": COOKIE_STRING,
  "origin": "https://claude.ai",
  "pragma": "no-cache",
  "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": '"Android"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
};

async function createConversation() {
  const convId = uuidv4();
  const res = await axios.post(
    `https://claude.ai/api/organizations/${ORG_ID}/chat_conversations`,
    {
      uuid: convId,
      name: "",
      enabled_imagine: true,
      include_conversation_preferences: true,
      is_temporary: false,
    },
    {
      headers: {
        ...BASE_HEADERS,
        "content-type": "application/json",
        "referer": "https://claude.ai/new",
      },
      decompress: true,
    }
  );
  return res.data.uuid;
}

async function uploadFile(convId, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  const mimeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mimeType = mimeMap[ext] || "application/octet-stream";

  const form = new FormData();
  form.append("file", fileBuffer, { filename: fileName, contentType: mimeType });

  const res = await axios.post(
    `https://claude.ai/api/organizations/${ORG_ID}/conversations/${convId}/wiggle/upload-file`,
    form,
    {
      headers: {
        ...BASE_HEADERS,
        ...form.getHeaders(),
        "referer": "https://claude.ai/new",
      },
      decompress: true,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  return res.data.file_uuid;
}

async function sendMessage(convId, prompt, fileUuids = []) {
  const humanUuid = uuidv4();
  const assistantUuid = uuidv4();

  const payload = {
    prompt,
    timezone: "Asia/Makassar",
    personalized_styles: [
      {
        isDefault: true,
        key: "Default",
        name: "Normal",
        nameKey: "normal_style_name",
        prompt: "Normal\n",
        summary: "Default responses from Claude",
        summaryKey: "normal_style_summary",
        type: "default",
      },
    ],
    locale: "en-US",
    attachments: [],
    files: fileUuids,
    model: MODEL,
    rendering_mode: "messages",
    sync_sources: [],
    // Mengaktifkan Web Search berdasarkan payload asli browser
    tools: [
      {
        type: "web_search_v0",
        name: "web_search"
      }
    ],
    turn_message_uuids: {
      human_message_uuid: humanUuid,
      assistant_message_uuid: assistantUuid,
    },
  };

  const res = await axios.post(
    `https://claude.ai/api/organizations/${ORG_ID}/chat_conversations/${convId}/completion`,
    payload,
    {
      headers: {
        ...BASE_HEADERS,
        "accept": "text/event-stream",
        "content-type": "application/json",
        "referer": `https://claude.ai/chat/${convId}`,
      },
      responseType: "stream",
      decompress: true,
    }
  );

  return new Promise((resolve, reject) => {
    let fullText = "";
    let buffer = "";

    res.data.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            fullText += evt.delta.text;
            // Dihapus agar tidak nge-spam console bot
            // process.stdout.write(evt.delta.text); 
          }
        } catch {}
      }
    });

    res.data.on("end", () => {
      resolve(fullText);
    });

    res.data.on("error", reject);
  });
}

// Tambahan parameter existingConvId untuk sistem memori
async function claude(query, imagePaths = [], existingConvId = null) {
  if (query.length > MAX_PROMPT) {
    throw new Error(`Prompt melebihi ${MAX_PROMPT} karakter (${query.length})`);
  }
  if (imagePaths.length > MAX_IMAGES) {
    throw new Error(`Max ${MAX_IMAGES} gambar, kamu kasih ${imagePaths.length}`);
  }

  let convId = existingConvId;
  let isNewSession = false;

  // Jika user tidak punya convId di database, buat sesi baru
  if (!convId) {
    convId = await createConversation();
    isNewSession = true;
    console.log(`[claude] Sesi Baru dibuat: ${convId}`);
  } else {
    console.log(`[claude] Melanjutkan sesi: ${convId}`);
  }

  try {
      const fileUuids = [];
      for (const imgPath of imagePaths) {
        console.log(`[upload] ${imgPath}`);
        const uuid = await uploadFile(convId, imgPath);
        fileUuids.push(uuid);
      }

      const reply = await sendMessage(convId, query, fileUuids);
      
      // Mengembalikan Object, berisi balasan dan ID percakapan untuk disimpan
      return {
          reply: reply,
          convId: convId
      };
      
  } catch (e) {
      // Jika error terjadi karena sesi lama sudah expired/terhapus di server claude,
      // kita otomatis buat sesi baru (Fallback)
      if (!isNewSession && (e.response?.status === 404 || e.response?.status === 403)) {
          console.log(`[claude] Sesi lama gagal (Expired/Dihapus). Membuat sesi baru...`);
          
          convId = await createConversation();
          
          const fileUuids = [];
          for (const imgPath of imagePaths) {
            const uuid = await uploadFile(convId, imgPath);
            fileUuids.push(uuid);
          }
          
          const reply = await sendMessage(convId, query, fileUuids);
          return { reply: reply, convId: convId };
      }
      
      throw e;
  }
}

module.exports = claude