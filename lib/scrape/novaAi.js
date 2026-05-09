const axios = require('axios');

/**
 * Scraper / API Wrapper untuk Nova AI
 * @param {String} text - Prompt atau pertanyaan untuk AI
 * @returns {Object|String} Response data dari Nova AI
 */
async function novaAi(text) {
  try {
    const payload = {
      question_text: text,
      conversation: {
        conversation_items: []
      }
    };

    const { data } = await axios.post('https://us-central1-nova-ai---android.cloudfunctions.net/app/ai-response/v2', payload, {
      headers: {
        'User-Agent': 'okhttp/4.10.0',
        'Accept-Encoding': 'gzip',
        'platform': 'Android',
        'version': '1.4.0',
        'language': 'in',
        'content-type': 'application/json; charset=utf-8'
      }
    });

    return data;
  } catch (error) {
    // Tangkap pesan error dari response API jika ada, atau kembalikan error default
    throw error.response?.data || error.message;
  }
}

module.exports = novaAi;