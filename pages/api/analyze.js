export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { industry, competitors, company, geo, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key required.' });
  }

  if (!industry || !competitors || competitors.length < 3) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const systemPrompt = `You are a senior market intelligence analyst. Your outputs are used by PE firms, venture investors, and M&A advisors. Accuracy and intellectual honesty are paramount. You cite sources explicitly and distinguish hard data from estimates. You never fabricate figures.

CRITICAL SOURCING RULES — strictly enforced:
- NEVER cite or reference Pune-based market research aggregators: Research & Markets, Mordor Intelligence, Grand View Research, MarketsandMarkets, Credence Research, Persistence Market Research, Allied Market Research, or any similar Indian data aggregator.
- Acceptable sources ONLY: SEC/EDGAR filings, disclosed earnings calls, Crunchbase public profiles, Latka SaaS database, Sacra research, PitchBook public data, LinkedIn headcount, IBISWorld, Arizton, CBRE, JLL, reputable journalism (TechCrunch, WSJ, FT, Bloomberg), and company-issued press releases.
- If no credible source exists for a figure, label it clearly as a proxy estimate and explain the methodology.`;

  const userPrompt = `Produce a rigorous TAM/SAM/SOM market intelligence report for:

Industry: ${industry}
Geography: ${geo || 'Global'}
Seed competitors: ${competitors.join(', ')}
${company ? `Client company: ${company}` : ''}

Instructions:
1. Expand the competitive set to 12-20 companies total (seeds + others you identify)
2. For each company find the best available revenue signal from: SEC/EDGAR filings, disclosed earnings, Crunchbase/PitchBook public profiles, Latka SaaS database, Sacra research, LinkedIn headcount (use $150-250K revenue-per-employee for B2B SaaS, adjust for sector), analyst estimates from credible reports, news articles with revenue disclosures
3. Derive TAM upward from observable data using credible analyst sources only — no Pune-based research firms
4. Compute HHI concentration index (sum of squared market share percentages, 0-10000 scale)
5. Label every figure with its source and be explicit about estimation methodology

Return ONLY valid JSON, no markdown fences, no preamble, no commentary:

{
  "industry_clean": "clean market name",
  "tam_description": "one sentence on what TAM covers",
  "geography": "string",
  "companies": [
    {
      "name": "string",
      "revenue_m": number,
      "type": "public|private|estimated",
      "signal_source": "SEC filing|Latka|Crunchbase|Sacra|funding proxy|headcount proxy|analyst estimate|news disclosure|disclosed",
      "notes": "brief methodology note"
    }
  ],
  "total_observable_rev_m": number,
  "tam_m": number,
  "tam_rationale": "detailed derivation — cite only credible sources",
  "sam_m": number,
  "sam_rationale": "what slice of TAM and why",
  "som_m": number,
  "som_rationale": "realistic 3yr capture for a new entrant",
  "top5_share_pct": number,
  "hhi_approx": number,
  "concentration_label": "Highly concentrated|Moderately concentrated|Fragmented",
  "concentration_insight": "one sentence on what this means for a new entrant",
  "market_cagr_pct": number,
  "cagr_source": "source — must be credible, not a Pune-based aggregator",
  "key_signals": ["signal1","signal2","signal3","signal4","signal5"],
  "caveats": ["caveat1","caveat2","caveat3","caveat4"]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Upstream API error' });
    }

    const data = await response.json();
    const textBlock = data.content.find((b) => b.type === 'text');
    if (!textBlock) return res.status(500).json({ error: 'No text response from model.' });

    let raw = textBlock.text.trim();
    const fb = raw.indexOf('{');
    const lb = raw.lastIndexOf('}');
    if (fb === -1) return res.status(500).json({ error: 'Model did not return valid JSON.' });
    raw = raw.slice(fb, lb + 1);

    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
