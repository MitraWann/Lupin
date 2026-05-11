const cloudscraper = require('cloudscraper');
const crypto = require('crypto');

/**
 * Perplexity AI Scraper API Wrapper
 * Didesain dengan Header Spoofing & Session Injection untuk WAF/Cloudflare Bypass
 */
class Perplexity {
  constructor() {
    this.baseUrl = 'https://www.perplexity.ai';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'text/event-stream',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/json',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/',
      'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin'
    };
    this.cookies = {
      'pplx.visitor-id': crypto.randomUUID(),
      'pplx.session-id': crypto.randomUUID(),
      'pplx.edge-vid': crypto.randomUUID(),
      'pplx.edge-sid': crypto.randomUUID()
    };
  }

  generateUUID() {
    return crypto.randomUUID();
  }

  getCookieString() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async ask(query) {
    const frontend_uuid = this.generateUUID();
    const read_write_token = this.generateUUID();
    const last_backend_uuid = this.generateUUID();

    const payload = {
      params: {
        last_backend_uuid: last_backend_uuid,
        read_write_token: read_write_token,
        attachments: [],
        language: 'id-ID',
        timezone: 'Asia/Jakarta',
        search_focus: 'internet',
        sources: ['web'],
        frontend_uuid: frontend_uuid,
        mode: 'copilot',
        model_preference: 'turbo',
        is_related_query: false,
        is_sponsored: false,
        prompt_source: 'user',
        query_source: 'followup',
        is_incognito: false,
        local_search_enabled: false,
        use_schematized_api: true,
        send_back_text_in_streaming_api: false,
        supported_block_use_cases: [
          'answer_modes', 'media_items', 'knowledge_cards', 'inline_entity_cards',
          'place_widgets', 'finance_widgets', 'prediction_market_widgets',
          'sports_widgets', 'flight_status_widgets', 'news_widgets',
          'shopping_widgets', 'jobs_widgets', 'search_result_widgets',
          'inline_images', 'inline_assets', 'placeholder_cards', 'diff_blocks',
          'inline_knowledge_cards', 'entity_group_v2', 'refinement_filters',
          'canvas_mode', 'maps_preview', 'answer_tabs', 'price_comparison_widgets',
          'preserve_latex', 'generic_onboarding_widgets', 'in_context_suggestions',
          'pending_followups', 'inline_claims', 'unified_assets'
        ],
        client_coordinates: null,
        mentions: [],
        skip_search_enabled: true,
        is_nav_suggestions_disabled: false,
        followup_source: 'link',
        source: 'default',
        always_search_override: false,
        override_no_search: false,
        should_ask_for_mcp_tool_confirmation: true,
        force_enable_browser_agent: false,
        supported_features: ['browser_agent_permission_banner_v1.1'],
        version: '2.18'
      },
      query_str: query
    };

    const response = await cloudscraper({
      method: 'POST',
      url: `${this.baseUrl}/rest/sse/perplexity_ask`,
      headers: {
        ...this.headers,
        'Cookie': this.getCookieString(),
        'x-request-id': this.generateUUID(),
        'x-perplexity-request-reason': 'perplexity-query-state-provider'
      },
      body: JSON.stringify(payload)
    });

    const lines = response.split('\n');
    let finalMessage = null;
    
    // Parsing Server-Sent Events (SSE) dari bawah ke atas untuk efisiensi
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith('data: ')) {
        try {
          const data = JSON.parse(lines[i].substring(5));
          if (data.text && data.final) {
            finalMessage = data;
            break;
          }
        } catch {}
      }
    }

    if (finalMessage && finalMessage.text) {
      try {
        const parsed = JSON.parse(finalMessage.text);
        for (const item of parsed) {
          if (item.step_type === 'FINAL' && item.content && item.content.answer) {
            const answerData = JSON.parse(item.content.answer);
            return {
              success: true,
              query: query,
              answer: answerData.answer
            };
          }
        }
      } catch {}
    }

    return {
      success: false,
      query: query,
      answer: null
    };
  }
}

// Ekspor instance agar langsung bisa digunakan di modul lain tanpa inisiasi ulang
async function perplexityScraper(query) {
    const perplexity = new Perplexity();
    return await perplexity.ask(query);
}

module.exports = perplexityScraper;