const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');
const fs = require('fs');
const path = require('path');

const BASE = 'https://z-lib.fm';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';
const ACCOUNTS_FILE = path.join(__dirname, '../../memo/akun-zlib.json');

const DEFAULT_HEADERS = {
  'user-agent': UA,
  'accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'referer': BASE,
};

class ZLibClient {
  constructor() {
    this.accounts = [];
    this.sessions = {};
    this.currentIndex = 0;
    this._loadAccounts();
  }

  _loadAccounts() {
    try {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      this.accounts = JSON.parse(raw);
    } catch (err) {
      this.accounts = [];
    }
  }

  _getAccount() {
    if (!this.accounts.length) throw new Error('No accounts available in akun-zlib.json');
    return this.accounts[this.currentIndex % this.accounts.length];
  }

  async login(email, password) {
    const res = await axios.post(`${BASE}/eapi/user/login`,
      qs.stringify({ email, password }),
      {
        timeout: 15000,
        headers: { ...DEFAULT_HEADERS, 'content-type': 'application/x-www-form-urlencoded', 'referer': `${BASE}/login` },
        validateStatus: s => true,
      }
    );

    if (!res.data?.success) throw new Error(res.data?.error || 'Login failed');

    const setCookies = res.headers['set-cookie'] || [];
    const extract = (name) => {
      const match = setCookies.find(c => c.startsWith(name + '='));
      return match ? match.split(';')[0] : null;
    };

    const cookie = [extract('bsrv'), extract('remix_userkey'), extract('remix_userid'), extract('selectedSiteMode')]
      .filter(Boolean).join('; ');

    const downloadsLimit = res.data.user?.downloads_limit || 10;
    const downloadsToday = res.data.user?.downloads_today || 0;

    this.sessions[email] = {
      cookie,
      expiry: Date.now() + (3600 * 1000 * 24),
      downloadsToday,
      downloadsLimit,
    };

    return this.sessions[email];
  }

  async ensureSession() {
    this._loadAccounts();

    for (let i = 0; i < this.accounts.length; i++) {
      const idx = (this.currentIndex + i) % this.accounts.length;
      const { email, password } = this.accounts[idx];
      const session = this.sessions[email];

      const needsLogin = !session || Date.now() > session.expiry;
      if (needsLogin) {
        try {
          await this.login(email, password);
        } catch {
          continue;
        }
      }

      const s = this.sessions[email];
      if (s.downloadsToday < s.downloadsLimit) {
        this.currentIndex = idx;
        return s.cookie;
      }
    }

    throw new Error('Semua akun telah mencapai batas download harian.');
  }

  async search(query, limit = 10) {
    try {
      const res = await axios.get(`${BASE}/s/`, {
        params: { q: query },
        timeout: 15000,
        headers: DEFAULT_HEADERS,
      });

      const $ = cheerio.load(res.data);
      const books = [];

      $('.book-item.resItemBoxBooks').slice(0, limit).each((_, el) => {
        const card = $(el).find('z-bookcard');
        books.push({
          index: books.length + 1,
          id: card.attr('id') || '',
          title: card.find('[slot="title"]').text().trim(),
          author: card.find('[slot="author"]').text().trim(),
          publisher: card.attr('publisher') || '',
          year: card.attr('year') || '',
          language: card.attr('language') || '',
          extension: card.attr('extension') || '',
          filesize: card.attr('filesize') || '',
          rating: card.attr('rating') || '',
          cover: card.find('img').attr('data-src') || '',
          href: card.attr('href') || '',
          download: card.attr('download') || '',
        });
      });

      return { success: true, query, total: books.length, books };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getBook(href) {
    try {
      const url = href.startsWith('http') ? href : `${BASE}${href}`;
      const res = await axios.get(url, {
        timeout: 15000,
        headers: DEFAULT_HEADERS,
      });

      const $ = cheerio.load(res.data);

      const title = $('h1[itemprop="name"], .book-title, h1').first().text().trim();
      const author = $('[itemprop="author"], .authors a').first().text().trim();
      const cover = $('img.book-cover, img[itemprop="image"], .details-book-cover img').attr('src') || '';
      const description = $('[itemprop="description"], #bookDescriptionBox, .book-description').first().text().trim().slice(0, 500);

      const details = {};
      $('table.book-details-full tr, .bookProperty').each((_, el) => {
        const key = $(el).find('td:first-child, .property_label').text().trim().replace(':', '');
        const val = $(el).find('td:last-child, .property_value').text().trim();
        if (key && val) details[key] = val;
      });

      const downloadHref = $('a[href*="/dl/"], a.btn-download, a[href*="download"]').first().attr('href') || '';

      return {
        success: true,
        title,
        author,
        cover: cover.startsWith('http') ? cover : `${BASE}${cover}`,
        description,
        details,
        downloadHref,
        url,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async download(downloadPath) {
    try {
      const cookie = await this.ensureSession();
      const { email } = this.accounts[this.currentIndex % this.accounts.length];

      const url = downloadPath.startsWith('http') ? downloadPath : `${BASE}${downloadPath}`;
      const fileRes = await axios.get(url, {
        timeout: 60000,
        responseType: 'arraybuffer',
        headers: { ...DEFAULT_HEADERS, 'cookie': cookie },
        maxRedirects: 10,
      });

      const contentType = fileRes.headers['content-type'] || 'application/octet-stream';
      if (contentType.includes('text/html')) {
        throw new Error('Download failed: received HTML. Session invalid or limit reached.');
      }

      // increment counter
      if (this.sessions[email]) this.sessions[email].downloadsToday++;

      const contentDisposition = fileRes.headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i) || contentDisposition.match(/filename=["']?([^"';\n]+)/i);
      const rawName = filenameMatch ? decodeURIComponent(filenameMatch[1].trim()) : `book-${Date.now()}.pdf`;
      const ext = rawName.split('.').pop().toLowerCase() || 'pdf';
      const baseName = rawName.replace(/[^a-zA-Z0-9 \-_.(),]/g, '').trim();
      const filename = baseName || `book-${Date.now()}.${ext}`;

      return {
        success: true,
        filename,
        contentType,
        buffer: Buffer.from(fileRes.data),
        size: fileRes.data.byteLength,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { ZLibClient };
