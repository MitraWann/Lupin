const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const uploadToCatbox = (filePath, userHash = null) => {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(filePath));
    form.append('reqtype', 'fileupload');
    
    if (userHash) {
      form.append('userhash', userHash);
    }

    axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
      },
    })
    .then(response => resolve(response.data))
    .catch(err => reject(err));
  });
};

uploadToCatbox('jokowi.jpeg')
  .then(url => console.log(url))
  .catch(err => console.log(err));