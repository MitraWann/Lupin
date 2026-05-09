/*
@ author: Herza
@ type : CommonJS
@ ========> Info <=========
@ github: https://github.com/herzonly
@ wa_channel: https://whatsapp.com/channel/0029VaGVOvq1iUxY6WgHLv2R
*/

const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function removebg(path) {
  const bypass = await axios.get(
    `https://anabot.my.id/api/tools/bypass?url=${encodeURIComponent('https://photoroom.com/tools/background-remover')}&siteKey=${encodeURIComponent('0x4AAAAAAAApeO5gC2AwBbrW')}&type=turnstile-min&proxy=&apikey=freeApikey`
  );

  const token = bypass.data.data.result.token;

  const form = new FormData();
  form.append('image_file', fs.readFileSync(path), 'image.png');

  const res = await axios.post('https://sdk.photoroom.com/v1/segment', form, {
    headers: {
      ...form.getHeaders(),
      'X-Api-Key': '10148f33e3f8d09a9b9aa6b775372a4ebf18b938',
      'X-Captcha': `CLOUDFLARE_${token}`,
    },
    responseType: 'arraybuffer',
  }).catch(e => { throw new Error(JSON.stringify(e.response?.data ? JSON.parse(e.response.data) : e.response?.status)) });

  return Buffer.from(res.data);
}

module.exports = removebg

 /*This Code Uploaded By NotMeBotz - MD, DO NOT DELETE WM | | Saturday, 21 March 2026 || 16:56:32 WIB */