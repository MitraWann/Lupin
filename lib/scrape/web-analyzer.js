const axios = require('axios');

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';

const DEFAULT_HEADERS = {
  'user-agent': UA,
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
};

async function fetchSafe(url, opts = {}) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      headers: { ...DEFAULT_HEADERS, ...opts.headers },
      maxRedirects: 5,
      ...opts,
    });
    return { ok: true, status: res.status, data: res.data, headers: res.headers };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 1. robots.txt ──────────────────────────────────────────────
async function checkRobots(origin) {
  const r = await fetchSafe(`${origin}/robots.txt`);
  if (!r.ok || r.status !== 200) return { allowed: null, raw: null, note: 'robots.txt tidak ditemukan' };

  const raw = typeof r.data === 'string' ? r.data : '';
  const lines = raw.split('\n').map(l => l.trim().toLowerCase());
  let userAgentAll = false;
  let disallowAll = false;
  let sitemaps = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('user-agent: *')) userAgentAll = true;
    if (userAgentAll && lines[i].startsWith('disallow: /')) disallowAll = true;
    if (lines[i].startsWith('sitemap:')) {
      sitemaps.push(raw.split('\n')[i].replace(/sitemap:\s*/i, '').trim());
    }
  }

  return {
    allowed: !disallowAll,
    disallowAll,
    sitemaps,
    raw: raw.slice(0, 500),
  };
}

// ── 2. Tech stack detection ────────────────────────────────────
function detectStack(html, headers) {
  const h = html || '';
  const stack = [];

  if (h.includes('__NEXT_DATA__') || h.includes('/_next/')) stack.push('Next.js (Pages Router)');
  else if (h.includes('/_next/')) stack.push('Next.js (App Router)');
  if (h.includes('__nuxt') || h.includes('/_nuxt/')) stack.push('Nuxt.js');
  if (h.includes('wp-content') || h.includes('wp-json')) stack.push('WordPress');
  if (h.includes('data-wf-site') || h.includes('webflow')) stack.push('Webflow');
  if (h.includes('gatsby') || h.includes('___gatsby')) stack.push('Gatsby');
  if (h.includes('ng-version') || h.includes('angular')) stack.push('Angular');
  if (h.includes('data-reactroot') || h.includes('react')) stack.push('React');
  if (h.includes('vue') || h.includes('__vue__')) stack.push('Vue.js');
  if (h.includes('svelte')) stack.push('Svelte');

  const server = headers?.['x-powered-by'] || headers?.['server'] || '';
  if (server) stack.push(`Server: ${server}`);

  return stack.length ? [...new Set(stack)] : ['Unknown'];
}

// ── 3. Render type ─────────────────────────────────────────────
function detectRenderType(html, headers) {
  const h = html || '';

  if (h.includes('__NEXT_DATA__')) return 'SSR/SSG (Next.js Pages Router)';
  if (h.includes('text/x-component') || h.includes('/_next/static/chunks/app/')) return 'RSC (Next.js App Router)';
  if (h.match(/<div id="app"><\/div>|<div id="root"><\/div>/)) return 'CSR (Client-Side Rendered)';
  if (h.includes('data-server-rendered')) return 'SSR (Vue/Nuxt)';
  if (h.length > 5000 && h.includes('<article') || h.includes('<p>')) return 'SSR/Static';

  return 'Unknown';
}

// ── 4. API endpoint discovery ──────────────────────────────────
async function discoverAPIs(origin, html, homeData = null) {
  const found = [];

  // Root JSON check
  const rootJson = typeof homeData === 'object' && Object.keys(homeData||{}).length > 0;
  if (rootJson) found.push({ source: 'root', endpoint: '/' });

  // Root JSON check
  if (homeData && typeof homeData === 'object' && Object.keys(homeData).length > 0) {
    found.push({ source: 'root', endpoint: '/' });
  }

  // Dari HTML
  const hrefMatches = [...(html || '').matchAll(/["'](\/api\/[^"'\s\)\\]{1,80})["']/g)];
  hrefMatches.forEach(m => found.push({ source: 'html', endpoint: m[1] }));

  // Common endpoints probe
  const commonPaths = [
    '/api', '/api/v1', '/api/v2', '/graphql', '/wp-json/wp/v2/posts',
    '/api/search', '/api/data', '/sitemap.xml', '/feed.xml', '/rss.xml',
  ];

  const probeResults = await Promise.all(
    commonPaths.map(async (path) => {
      const r = await fetchSafe(`${origin}${path}`, {
        headers: { ...DEFAULT_HEADERS, accept: 'application/json' },
        timeout: 5000,
      });
      const ct = r.headers?.['content-type'] || ''; const isJson = ct.includes('application/json') || (typeof r.data === 'object' && !Array.isArray(r.data) && Object.keys(r.data||{}).length > 0) || (typeof r.data === 'string' && (r.data.trim().startsWith('{') || r.data.trim().startsWith('[')) && !r.data.includes('Cant load')); const accessible = r.ok && (r.status === 200 || r.status === 201) && isJson; return { path, status: r.status, accessible, isJson, ct };
    })
  );

  const accessible = probeResults.filter(r => r.accessible);

  // GraphQL detection
  const graphqlProbe = await fetchSafe(`${origin}/graphql`, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, 'content-type': 'application/json' },
    data: JSON.stringify({ query: '{ __typename }' }),
    timeout: 5000,
  });
  const hasGraphQL = graphqlProbe.ok && graphqlProbe.status !== 404;

  const rootEndpoints = found.filter(f => f.source === 'root').map(f => f.endpoint);
  return {
    fromHTML: [...new Set(hrefMatches.map(m => m[1]))].slice(0, 10),
    accessible: [...new Set([...rootEndpoints, ...accessible.map(r => r.path)])],
    hasGraphQL,
    probed: probeResults,
  };
}

// ── 5. JS bundle scan ──────────────────────────────────────────
async function scanBundles(origin, html) {
  const scriptSrcs = [...(html || '').matchAll(/src=["']([^"']*\.js[^"']*)['"]/g)]
    .map(m => m[1])
    .filter(s => !s.includes('google') && !s.includes('facebook') && !s.includes('analytics'))
    .slice(0, 5);

  const results = { apiKeys: [], endpoints: [], envVars: [] };

  for (const src of scriptSrcs) {
    const url = src.startsWith('http') ? src : `${origin}${src}`;
    const r = await fetchSafe(url, { timeout: 8000 });
    if (!r.ok || typeof r.data !== 'string') continue;

    const text = r.data;
    const apis = [...text.matchAll(/["'`](\/api\/[^"'`\s\)\\]{3,60})["'`]/g)].map(m => m[1]);
    const keys = [...text.matchAll(/AIza[A-Za-z0-9_\-]{35}/g)].map(m => m[0]);
    const envs = [...text.matchAll(/NEXT_PUBLIC_[A-Z_]+/g)].map(m => m[0]);
    const urls = [...text.matchAll(/["'`](https?:\/\/[a-z0-9\-\.]+\/api[^"'`\s\)]{0,60})["'`]/g)].map(m => m[1]);

    results.apiKeys.push(...keys);
    results.endpoints.push(...apis, ...urls);
    results.envVars.push(...envs);
  }

  return {
    apiKeys: [...new Set(results.apiKeys)],
    endpoints: [...new Set(results.endpoints)].slice(0, 20),
    envVars: [...new Set(results.envVars)],
  };
}

// ── 6. Auth & rate limit ───────────────────────────────────────
function checkProtection(html, headers) {
  const h = html || '';
  const issues = [];

  if (h.includes('cf-ray') || headers?.['cf-ray']) issues.push('Cloudflare');
  if (h.includes('captcha') || h.includes('recaptcha')) issues.push('CAPTCHA');
  if (h.includes('login') && h.includes('password') && h.length < 3000) issues.push('Login wall');
  if (headers?.['x-ratelimit-limit']) issues.push(`Rate limit: ${headers['x-ratelimit-limit']} req`);
  if (headers?.['set-cookie']) issues.push('Cookie auth required');

  const cors = headers?.['access-control-allow-origin'];
  return { issues, cors: cors || null };
}

// ── 7. Scrapeability score ─────────────────────────────────────
function scoreScrapability(robots, renderType, apis, protection, bundles) {
  let score = 100;
  const reasons = [];

  if (robots.disallowAll) { score -= 40; reasons.push('robots.txt melarang scraping'); }
  if (renderType.includes('CSR')) { score -= 25; reasons.push('CSR — butuh headless browser'); }
  if (protection.issues.includes('Cloudflare')) { score -= 20; reasons.push('Cloudflare protection'); }
  if (protection.issues.includes('CAPTCHA')) { score -= 30; reasons.push('CAPTCHA'); }
  if (protection.issues.includes('Login wall')) { score -= 40; reasons.push('Login required'); }
  if (apis.accessible.length > 0) { score += 10; reasons.push(`${apis.accessible.length} API endpoint accessible`); }
  if (bundles.endpoints.length > 0) { score += 10; reasons.push(`${bundles.endpoints.length} endpoint ditemukan di JS`); }

  score = Math.max(0, Math.min(100, score));

  let verdict;
  if (score >= 70) verdict = '✅ Mudah di-scrape';
  else if (score >= 40) verdict = '⚠️ Bisa di-scrape dengan effort';
  else verdict = '❌ Sulit di-scrape';

  return { score, verdict, reasons };
}

// ── 8. Alternatives ────────────────────────────────────────────
function suggestAlternatives(origin, robots, apis, stack, renderType) {
  const alts = [];

  if (apis.accessible.includes('/wp-json/wp/v2/posts')) {
    alts.push('WordPress REST API: /wp-json/wp/v2/posts?per_page=10');
  }
  if (apis.accessible.includes('/sitemap.xml') || robots.sitemaps?.length) {
    alts.push('Sitemap: ' + (robots.sitemaps?.[0] || `${origin}/sitemap.xml`));
  }
  if (apis.accessible.includes('/rss.xml') || apis.accessible.includes('/feed.xml')) {
    alts.push('RSS Feed tersedia');
  }
  if (apis.hasGraphQL) {
    alts.push('GraphQL endpoint tersedia di /graphql');
  }
  if (renderType.includes('CSR')) {
    alts.push('Gunakan Puppeteer/Playwright untuk render JS');
  }
  if (stack.includes('WordPress')) {
    alts.push('WordPress REST API tersedia secara default');
  }

  alts.push('Cek apakah tersedia official API/developer portal');
  alts.push('Gunakan Google Cache: cache:<url>');

  return alts;
}

// ── MAIN ───────────────────────────────────────────────────────
async function analyzeWebsite(url) {
  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    // Fetch homepage
    const home = await fetchSafe(url);
    if (!home.ok) return { success: false, error: `Gagal fetch: ${home.error}` };

    const html = typeof home.data === 'string' ? home.data : '';
    const headers = home.headers || {};

    const [robots, apis, bundles] = await Promise.all([
      checkRobots(origin),
      discoverAPIs(origin, html, home.data),
      scanBundles(origin, html),
    ]);

    const stack = detectStack(html, headers);
    const renderType = detectRenderType(html, headers);
    const protection = checkProtection(html, headers);
    const scrapability = scoreScrapability(robots, renderType, apis, protection, bundles);
    const alternatives = suggestAlternatives(origin, robots, apis, stack, renderType);

    return {
      success: true,
      url,
      origin,
      httpStatus: home.status,
      stack,
      renderType,
      robots: {
        allowed: robots.allowed,
        disallowAll: robots.disallowAll,
        sitemaps: robots.sitemaps,
      },
      apis: {
        fromHTML: apis.fromHTML,
        accessible: apis.accessible,
        hasGraphQL: apis.hasGraphQL,
      },
      bundles: {
        endpoints: bundles.endpoints,
        envVars: bundles.envVars,
        apiKeys: bundles.apiKeys.map(k => k.slice(0, 8) + '...'),
      },
      protection,
      scrapability,
      alternatives,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { analyzeWebsite };