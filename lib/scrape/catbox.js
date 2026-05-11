const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");

/**
 * Catbox.moe Uploader Scraper dengan WAF Bypass
 * @param {Buffer} buffer - Buffer media
 * @param {String} fileName - Nama file beserta ekstensi (opsional)
 * @returns {Promise<Object>} Respon dari Catbox
 */
async function catboxUpload(buffer, fileName) {
  try {
    // Jika tidak ada nama file, buat random hex
    if (!fileName) {
      fileName = `${crypto.randomBytes(6).toString("hex")}.bin`;
    }

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, fileName);

    // WAF Bypass Headers
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://catbox.moe",
      "Referer": "https://catbox.moe/",
      "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      ...form.getHeaders()
    };

    // [CRITICAL FIX] Kalkulasi dan set Content-Length untuk mencegah error 412 WAF Cloudflare
    try {
      headers["Content-Length"] = form.getLengthSync();
    } catch (err) {
      // Abaikan jika tidak bisa dihitung (sangat jarang terjadi pada Buffer)
    }

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    const url = response.data.trim();

    if (!url.startsWith("https://files.catbox.moe/")) {
      throw new Error(`Upload gagal, respon server: ${url}`);
    }

    return {
      url: url,
      filename: fileName,
      size: buffer.length
    };
  } catch (error) {
    let msg = error.message;
    if (error.response) {
      msg += ` (Status: ${error.response.status}) - ${error.response.data}`;
    }
    throw new Error(`Catbox Upload Error: ${msg}`);
  }
}

module.exports = catboxUpload;