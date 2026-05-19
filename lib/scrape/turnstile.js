'use strict'

const { connect } = require('/home/container/node_modules/puppeteer-real-browser')
const { PuppeteerScreenRecorder } = require('/home/container/node_modules/puppeteer-screen-recorder')
const fs = require('fs')
const path = require('path')

const FAKE_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Turnstile</title>
</head>
<body>
  <div class="turnstile"></div>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" defer></script>
  <script>
    window.onloadTurnstileCallback = function () {
      turnstile.render('.turnstile', {
        sitekey: '<site-key>',
        callback: function (token) {
          var c = document.createElement('input');
          c.type = 'hidden';
          c.name = 'cf-response';
          c.value = token;
          document.body.appendChild(c);
        },
      });
    };
  </script>
</body>
</html>`

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

class TurnstileSolver {
  constructor(opts = {}) {
    this.timeout   = opts.timeout   ?? 60000
    this.record    = opts.record    ?? false
    this.recordDir = opts.recordDir ?? path.join(process.cwd(), 'recordings')
    this.proxy     = opts.proxy     ?? null
    this.width     = opts.width     ?? 1280
    this.height    = opts.height    ?? 720
    this.browser   = null
    this.isReady   = false
  }

  async initialize() {
    if (this.isReady) return
    const { browser } = await connect({
      headless: false,
      turnstile: true,
      connectOption: {
        defaultViewport: { width: this.width, height: this.height },
        timeout: 120000,
        protocolTimeout: 300000,
        args: [
          `--window-size=${this.width},${this.height}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
        ],
      },
      disableXvfb: false,
    })
    this.browser = browser
    this.isReady = true
  }

  async cleanup() {
    if (this.browser) {
      try { await this.browser.close() } catch {}
      this.browser = null
      this.isReady = false
    }
  }

  async _startRecording(page, label) {
    if (!this.record) return null
    ensureDir(this.recordDir)
    const safe = label.replace(/[^a-z0-9_-]/gi, '_')
    const output = path.join(this.recordDir, `${safe}_${Date.now()}.mp4`)
    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 25,
      videoFrame: { width: this.width, height: this.height },
      videoCrf: 18,
      videoCodec: 'libx264',
      videoPreset: 'ultrafast',
      aspectRatio: '16:9',
    })
    await recorder.start(output)
    return { recorder, output }
  }

  async _stopRecording(rec) {
    if (!rec) return
    try { await rec.recorder.stop() } catch (err) { console.warn('[Turnstile] Failed to stop recording:', err.message) }
  }

  async _newPage() {
    const page = await this.browser.newPage()
    await page.setDefaultTimeout(30000)
    await page.setDefaultNavigationTimeout(30000)
    if (this.proxy?.username && this.proxy?.password) {
      await page.authenticate({ username: this.proxy.username, password: this.proxy.password })
    }
    return page
  }

  async solveWithSitekey(url, siteKey) {
    if (!this.isReady) await this.initialize()
    const t0 = Date.now()
    const page = await this._newPage()
    const rec = await this._startRecording(page, `sitekey_${siteKey}`)
    try {
      const fakeHtml = FAKE_PAGE.replace(/<site-key>/g, siteKey)
      const baseUrl = url.endsWith('/') ? url : url + '/'
      await page.setRequestInterception(true)
      page.on('request', async (req) => {
        if ([url, baseUrl].includes(req.url()) && req.resourceType() === 'document') {
          await req.respond({ status: 200, contentType: 'text/html', body: fakeHtml })
        } else {
          await req.continue().catch(() => {})
        }
      })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForSelector('[name="cf-response"]', { timeout: this.timeout })
      const token = await page.evaluate(() => document.querySelector('[name="cf-response"]')?.value ?? null)
      await this._stopRecording(rec)
      await page.close()
      if (!token || token.length < 10) throw new Error('Token invalid or empty')
      return { success: true, creator: 'XAi Community', token, time: +((Date.now() - t0) / 1000).toFixed(3) }
    } catch (err) {
      await this._stopRecording(rec)
      try { await page.close() } catch {}
      return { success: false, error: err.message, time: +((Date.now() - t0) / 1000).toFixed(3) }
    }
  }

  async solveFromPage(url) {
    if (!this.isReady) await this.initialize()
    const t0 = Date.now()
    const page = await this._newPage()
    const rec = await this._startRecording(page, 'page_solve')
    try {
      await page.evaluateOnNewDocument(() => {
        async function waitForToken() {
          let token = null
          while (!token) {
            try { token = window.turnstile?.getResponse() } catch {}
            await new Promise((r) => setTimeout(r, 500))
          }
          const c = document.createElement('input')
          c.type = 'hidden'
          c.name = 'cf-response'
          c.value = token
          document.body.appendChild(c)
        }
        waitForToken()
      })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForSelector('[name="cf-response"]', { timeout: this.timeout })
      const token = await page.evaluate(() => document.querySelector('[name="cf-response"]')?.value ?? null)
      await this._stopRecording(rec)
      await page.close()
      if (!token || token.length < 10) throw new Error('Token invalid or empty')
      return { success: true, creator: 'XAi Community', token, time: +((Date.now() - t0) / 1000).toFixed(3) }
    } catch (err) {
      await this._stopRecording(rec)
      try { await page.close() } catch {}
      return { success: false, error: err.message, time: +((Date.now() - t0) / 1000).toFixed(3) }
    }
  }

  async solve(url, siteKey = null) {
    return siteKey ? this.solveWithSitekey(url, siteKey) : this.solveFromPage(url)
  }
}

module.exports = TurnstileSolver
