const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const cheerio = require('cheerio');

const BASE = 'https://sci-hub.ru';
const OPENALEX = 'https://api.openalex.org';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';

const DEFAULT_HEADERS = {
  'user-agent': UA,
  'accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'referer': BASE,
};

const isDOI = (str) => /^10\.\d{4,}(\.\d+)*\/\S+/.test(str.trim());
const isURL = (str) => /^https?:\/\//.test(str.trim());

class SciHubClient {
  async searchOpenAlex(query, limit = 5) {
    try {
      const res = await axios.get(`${OPENALEX}/works`, {
        params: {
          search: query,
          per_page: limit,
          select: 'title,authorships,publication_year,open_access,doi',
        },
        timeout: 15000,
        headers: { 'accept': 'application/json' },
        validateStatus: s => true,
      });

      if (!res.data.results?.length) throw new Error('Tidak ada hasil ditemukan.');

      const results = res.data.results.map((r, i) => ({
        index: i + 1,
        title: r.title || 'Untitled',
        author: r.authorships?.[0]?.author?.display_name || '',
        year: r.publication_year || '-',
        doi: r.doi ? r.doi.replace('https://doi.org/', '') : null,
        pdf: r.open_access?.oa_url || null,
      }));

      return { success: true, total: res.data.meta?.count || 0, results };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async fetchBySciHub(input) {
    try {
      const query = input.trim();
      const fetchUrl = `${BASE}/${query}`;

      const res = await axios.get(fetchUrl, {
        timeout: 15000,
        headers: DEFAULT_HEADERS,
        validateStatus: s => true,
      });

      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const $ = cheerio.load(res.data);

      let pdfPath = $('meta[name="citation_pdf_url"]').attr('content')
        || $('#pdf').attr('src')
        || $('embed[src]').attr('src')
        || $('iframe[src]').attr('src')
        || $('a[href*=".pdf"]').first().attr('href')
        || '';

      if (!pdfPath) throw new Error('PDF tidak ditemukan di Sci-Hub.');

      if (pdfPath.startsWith('//')) pdfPath = 'https:' + pdfPath;
      else if (pdfPath.startsWith('/')) pdfPath = BASE + pdfPath;

      const pdfUrl = pdfPath.split('#')[0];
      const title = $('meta[name="citation_title"]').attr('content') || $('title').text().trim() || query;
      const author = $('meta[name="citation_author"]').attr('content') || '';

      return { success: true, pdfUrl, title, author };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }


  async resolveOpenAccess(doi) {
    try {
      const res = await axios.get(`https://api.unpaywall.org/v2/${doi}`, {
        params: { email: 'bot@flora.app' },
        timeout: 10000,
        validateStatus: s => true,
      });
      if (res.status !== 200 || !res.data) throw new Error('Unpaywall gagal');
      const locs = res.data.oa_locations || [];
      const pdf = locs.find(l => l.url_for_pdf)?.url_for_pdf || null;
      if (!pdf) throw new Error('Tidak ada PDF OA');
      return { success: true, pdfUrl: pdf, title: res.data.title || '', author: res.data.z_authors?.[0]?.family || '' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  async download(pdfUrl) {
    try {
      const res = await axios.get(pdfUrl, {
        timeout: 60000,
        responseType: 'arraybuffer',
        headers: { ...DEFAULT_HEADERS, 'accept': 'application/pdf,*/*' },
        maxRedirects: 10,
        httpsAgent,
      });

      const contentType = res.headers['content-type'] || 'application/pdf';
      if (contentType.includes('text/html')) {
        const cookies = res.headers['set-cookie'];
        if (!cookies?.length) throw new Error('HTML_RESPONSE');

        const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
        const retry = await axios.get(pdfUrl, {
          timeout: 60000,
          responseType: 'arraybuffer',
          headers: {
            ...DEFAULT_HEADERS,
            'accept': 'application/pdf,*/*',
            'cookie': cookieStr,
          },
          maxRedirects: 10,
          httpsAgent,
        });

        const retryType = retry.headers['content-type'] || 'application/pdf';
        if (retryType.includes('text/html')) throw new Error('HTML_RESPONSE');

        const retryDisposition = retry.headers['content-disposition'] || '';
        const retryMatch = retryDisposition.match(/filename\*=UTF-8''([^;\n]+)/i) || retryDisposition.match(/filename=["']?([^"';\n]+)/i);
        const retryRaw = retryMatch ? decodeURIComponent(retryMatch[1].trim()) : `jurnal-${Date.now()}.pdf`;
        const retryFilename = retryRaw.replace(/[^a-zA-Z0-9 \-_.(),]/g, '').trim() || `jurnal-${Date.now()}.pdf`;

        return {
          success: true,
          filename: retryFilename,
          contentType: retryType,
          buffer: Buffer.from(retry.data),
          size: retry.data.byteLength,
        };
      }

      const contentDisposition = res.headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i) || contentDisposition.match(/filename=["']?([^"';\n]+)/i);
      const rawName = filenameMatch ? decodeURIComponent(filenameMatch[1].trim()) : `jurnal-${Date.now()}.pdf`;
      const filename = rawName.replace(/[^a-zA-Z0-9 \-_.(),]/g, '').trim() || `jurnal-${Date.now()}.pdf`;

      return {
        success: true,
        filename,
        contentType,
        buffer: Buffer.from(res.data),
        size: res.data.byteLength,
      };
    } catch (err) {
      // jika PDF langsung gagal, coba via sci-hub
      if (err.message === 'HTML_RESPONSE') {
        return { success: false, error: 'PDF tidak dapat diakses langsung (paywalled). Gunakan Sci-Hub via DOI.', fallback: true };
      }
      return { success: false, error: err.message };
    }
  }
}

module.exports = { SciHubClient, isDOI, isURL };
