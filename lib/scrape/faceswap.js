const axios = require('axios');
const FormData = require('form-data');

/**
 * Membuat job Faceswap di API
 * @param {Buffer} sourceBuffer - Buffer gambar sumber (wajah)
 * @param {Buffer} targetBuffer - Buffer gambar target (tubuh/background)
 * @returns {String} Task ID
 */
async function createjob(sourceBuffer, targetBuffer) {
  const form = new FormData();
  
  // Menggunakan buffer langsung dengan menyertakan opsi filename & contentType
  form.append('source_image', sourceBuffer, {
    filename: 'source.jpg',
    contentType: 'image/jpeg'
  });

  form.append('target_image', targetBuffer, {
    filename: 'target.jpg',
    contentType: 'image/jpeg'
  });

  const create = await axios.post('https://api.lovefaceswap.com/api/face-swap/create-poll', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json',
      'origin': 'https://lovefaceswap.com',
      'referer': 'https://lovefaceswap.com/'
    }
  });

  return create.data.data.task_id;
}

/**
 * Mengecek status job Faceswap
 * @param {String} jobId - Task ID dari createjob
 * @returns {Object} Data hasil API
 */
async function checkjob(jobId) {
  const check = await axios.get(`https://api.lovefaceswap.com/api/common/get?job_id=${jobId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'origin': 'https://lovefaceswap.com',
      'referer': 'https://lovefaceswap.com/'
    }
  });

  return check.data.data;
}

/**
 * Fungsi utama untuk eksekusi Faceswap
 * @param {Buffer} sourceBuffer 
 * @param {Buffer} targetBuffer 
 * @returns {Object} { job_id, image }
 */
async function faceswap(sourceBuffer, targetBuffer) {
  const jobId = await createjob(sourceBuffer, targetBuffer);

  let result;
  let attempts = 0;
  const maxAttempts = 20; // Batas maksimal polling (20 * 3 detik = 60 detik)

  do {
    if (attempts >= maxAttempts) throw new Error('API Timeout: Gagal memproses gambar dalam waktu yang ditentukan.');
    
    await new Promise(r => setTimeout(r, 3000));
    result = await checkjob(jobId);
    attempts++;
  } while (!result || !result.image_url || result.image_url.length === 0);

  return {
    job_id: jobId,
    image: result.image_url[0]
  };
}

module.exports = faceswap;