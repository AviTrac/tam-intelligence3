import { useState } from 'react';
import Head from 'next/head';

const LOADING_STEPS = [
  'Seeding competitive landscape from your inputs',
  'Expanding to full competitor set (target: 15-20 companies)',
  'Pulling revenue signals — SEC, Crunchbase, Latka, Sacra, analyst reports',
  'Classifying signal quality: filing vs estimate vs proxy',
  'Computing market concentration (HHI, top-5 share)',
  'Deriving TAM / SAM / SOM from observable base',
  'Assembling sourced output',
];

function fmtM(n) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'B';
  return '$' + Math.round(n) + 'M';
}

function Badge({ type }) {
  const map = {
    public: { bg: 'rgba(45,204,143,0.12)', color: '#2dcc8f', label: 'Public' },
    private: { bg: 'rgba(155,138,244,0.12)', color: '#9b8af4', label: 'Private' },
    estimated: { bg: 'rgba(232,169,74,0.12)', color: '#e8a94a', label: 'Est.' },
  };
  const s = map[type] || map.estimated;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 7px', borderRadius: 3, fontWeight: 500, fontFamily: 'var(--mono)',
    }}>{s.label}</span>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--surface2)', padding: '18px 20px', flex: 1 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 400, lineHeight: 1, color: color || 'var(--text)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
    </div>
  );
}

function StatCard({ label, value, note, noteColor }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 11, color: noteColor || 'var(--text3)', marginTop: 2 }}>{note}</div>
    </div>
  );
}

function Panel({ title, note, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text2)' }}>{title}</span>
        {note && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{note}</span>}
      </div>
      {children}
    </div>
  );
}

function AnalysisBlock({ label, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function ApiKeyInstructions() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>One-time setup — 3 minutes</div>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>
        This tool runs on Anthropic's AI. You need a free API key — it costs roughly <strong style={{ color: 'var(--text)' }}>$0.20–0.40 per analysis</strong> charged directly to your Anthropic account. No subscription, pay only when you use it.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['1', 'Go to', 'console.anthropic.com', 'https://console.anthropic.com', 'and create a free account'],
          ['2', 'Click', 'API Keys', null, '→ Create Key → copy it'],
          ['3', 'Add a credit card and deposit', '$5', null, '— enough for 15–25 analyses'],
          ['4', 'Paste your key below', '', null, 'and run your first analysis'],
        ].map(([num, pre, link, href, post]) => (
          <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green-dim)', border: '1px solid rgba(45,204,143,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)' }}>{num}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              {pre} {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>{link}</a> : <strong style={{ color: 'var(--text)' }}>{link}</strong>} {post}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [industry, setIndustry] = useState('');
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [c3, setC3] = useState('');
  const [company, setCompany] = useState('');
  const [geo, setGeo] = useState('');
  const [view, setView] = useState('form');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPct, setLoadingPct] = useState(0);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [keyValid, setKeyValid] = useState(false);

  function checkKey(val) {
    setApiKey(val);
    setKeyValid(val.startsWith('sk-ant-') && val.length > 20);
  }

  async function runAnalysis() {
    if (!keyValid) { alert('Please enter a valid Anthropic API key first.'); return; }
    if (!industry.trim() || !c1.trim() || !c2.trim() || !c3.trim()) {
      alert('Please fill in the industry and all 3 seed competitors.');
      return;
    }
    setView('loading');
    setLoadingStep(0);
    setLoadingPct(5);

    const stepPcts = [5, 18, 35, 52, 68, 82, 94];
    let si = 0;
    const interval = setInterval(() => {
      if (si < LOADING_STEPS.length) {
        setLoadingStep(si);
        setLoadingPct(stepPcts[si]);
        si++;
      }
    }, 2200);

    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: industry.trim(),
          competitors: [c1.trim(), c2.trim(), c3.trim()],
          company: company.trim(),
          geo: geo.trim() || 'Global',
          apiKey,
        }),
      });

      clearInterval(interval);
      const data = await resp.json();

      if (!resp.ok) {
        setErrorMsg(data.error || 'Unknown error');
        setView('error');
        return;
      }

      setLoadingPct(100);
      setTimeout(() => {
        setResults(data);
        setView('results');
      }, 400);
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err.message);
      setView('error');
    }
  }

  function reset() {
    setView('form');
    setResults(null);
    setErrorMsg('');
    setLoadingStep(0);
    setLoadingPct(0);
  }

  const s = {
    app: { maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' },
    eyebrow: { fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 12 },
    h1: { fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, lineHeight: 1.15, marginBottom: 10 },
    subtitle: { fontSize: 14, color: 'var(--text2)', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 },
    sectionHead: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 20 },
    fieldLabel: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 },
    hint: { fontSize: 11, color: 'var(--text3)', marginTop: 4, lineHeight: 1.5 },
    runBtn: { width: '100%', padding: 14, background: 'var(--green)', color: '#0a1a12', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, marginTop: 20, letterSpacing: '0.02em' },
    disclaimer: { marginTop: 14, fontSize: 11, color: 'var(--text3)', lineHeight: 1.7, padding: '12px 14px', background: 'var(--surface)', borderRadius: 6, borderLeft: '2px solid var(--border2)' },
  };

  return (
    <>
      <Head>
        <title>Market Intelligence — TAM · SAM · SOM</title>
        <meta name="description" content="AI-powered market sizing from real competitive data." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={s.app}>

        {view === 'form' && (
          <>
            <div style={{ marginBottom: 48, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
              <div style={s.eyebrow}>Market Intelligence Engine</div>
              <h1 style={s.h1}>TAM · SAM · SOM<br />From Reality, Not Assumptions</h1>
              <p style={s.subtitle}>Drop 3 known competitors. This engine expands the competitive set, pulls observable revenue signals from public sources, and derives a sourced market sizing — no guesswork required from you.</p>
            </div>

            <ApiKeyInstructions />

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: keyValid ? 'var(--green)' : 'var(--text3)', flexShrink: 0, boxShadow: keyValid ? '0 0 6px rgba(45,204,143,0.5)' : 'none', transition: 'all 0.3s' }} />
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Your API Key</label>
                <input type="password" value={apiKey} onChange={e => checkKey(e.target.value)} placeholder="sk-ant-..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }} />
              </div>
              <p style={{ ...s.hint, marginTop: 6 }}>Your key is never stored — it's used only for this request and never logged.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={s.fieldLabel}>Industry / Market</label>
                <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. B2B sales intelligence SaaS, dental practice management software" />
                <p style={s.hint}>Be specific. "SaaS" is too broad. "Field service management software" is right.</p>
              </div>

              <div style={s.sectionHead}>Seed Competitors</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[['Competitor 1', c1, setC1], ['Competitor 2', c2, setC2], ['Competitor 3', c3, setC3]].map(([ph, val, set]) => (
                  <div key={ph}>
                    <label style={s.fieldLabel}>{ph}</label>
                    <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={`e.g. ${ph === 'Competitor 1' ? 'Salesforce' : ph === 'Competitor 2' ? 'HubSpot' : 'Apollo.io'}`} />
                  </div>
                ))}
              </div>
              <p style={s.hint}>These seed the expansion. Include both big names and direct peers.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <div>
                  <label style={s.fieldLabel}>Your Company (optional)</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label style={s.fieldLabel}>Geography Focus (optional)</label>
                  <input type="text" value={geo} onChange={e => setGeo(e.target.value)} placeholder="e.g. North America, Global, EMEA" />
                </div>
              </div>
            </div>

            <button style={{ ...s.runBtn, opacity: keyValid ? 1 : 0.5 }} onClick={runAnalysis} disabled={!keyValid}>
              Run Market Intelligence
            </button>

            <div style={s.disclaimer}>
              Revenue figures are derived from SEC filings, disclosed earnings, Crunchbase/PitchBook public profiles, Latka, Sacra, LinkedIn headcount proxies, and credible analyst estimates. Pune-based data aggregators are explicitly excluded. Private company figures are labeled as estimates. All outputs are directional only.
            </div>
          </>
        )}

        {view === 'loading' && (
          <div style={{ paddingTop: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', marginBottom: 16 }}>
              {LOADING_STEPS[loadingStep] || 'Finalizing...'}
            </div>
            <div style={{ height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', background: 'var(--green)', borderRadius: 1, width: `${loadingPct}%`, transition: 'width 1.2s ease' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20 }}>
              {LOADING_STEPS.map((step, i) => (
                <div key={i} style={{ fontSize: 12, color: i < loadingStep ? 'var(--green)' : i === loadingStep ? 'var(--text2)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: i < loadingStep ? 'var(--green)' : i === loadingStep ? 'var(--amber)' : 'var(--text3)' }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'error' && (
          <div>
            <div style={{ background: 'rgba(224,90,78,0.1)', border: '1px solid rgba(224,90,78,0.2)', borderRadius: 8, padding: '16px 18px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
              Error: {errorMsg}
            </div>
            <button onClick={reset}>← Try again</button>
          </div>
        )}

        {view === 'results' && results && (() => {
          const d = results;
          const sorted = [...d.companies].sort((a, b) => b.revenue_m - a.revenue_m);
          const maxRev = sorted[0]?.revenue_m || 1;
          const concColor = d.hhi_approx > 2500 ? '#e05a4e' : d.hhi_approx > 1500 ? '#e8a94a' : '#2dcc8f';
          const concPct = Math.min(100, Math.round((d.hhi_approx / 10000) * 100));

          return (
            <>
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={s.eyebrow}>Market Intelligence Report · {d.geography}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 6 }}>{d.industry_clean}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 560 }}>{d.tam_description}</div>
              </div>

              <div style={{ display: 'flex', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                <MetricCard label="Total Addressable Market" value={fmtM(d.tam_m)} sub="observable base + expansion" color="#2dcc8f" />
                <MetricCard label="Serviceable Addressable" value={fmtM(d.sam_m)} sub={`${d.geography} serviceable segment`} color="#e8a94a" />
                <MetricCard label="Obtainable · 3yr" value={fmtM(d.som_m)} sub={`new entrant · 3yr horizon`} color="#9b8af4" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <StatCard label="Observable Revenue" value={fmtM(d.total_observable_rev_m)} note={`${d.companies.length} companies tracked`} />
                <StatCard label="Top-5 Share" value={`${d.top5_share_pct}%`} note={d.concentration_label} noteColor={concColor} />
                <StatCard label="Market CAGR" value={`${d.market_cagr_pct}%`} note={d.cagr_source} />
              </div>

              <Panel title="Competitive Landscape" note={`${d.companies.length} companies`}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px 70px 100px', gap: 10, padding: '8px 18px', background: 'var(--bg)' }}>
                  {['Company','Revenue share','Revenue','Type','Signal'].map(h => (
                    <div key={h} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Revenue' || h === 'Type' || h === 'Signal' ? 'right' : 'left' }}>{h}</div>
                  ))}
                </div>
                {sorted.map((co, i) => {
                  const barW = Math.round((co.revenue_m / maxRev) * 100);
                  const pct = ((co.revenue_m / d.total_observable_rev_m) * 100).toFixed(1);
                  return (
                    <div key={i} title={co.notes} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px 70px 100px', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{co.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: '#2dcc8f', borderRadius: 2, opacity: 0.7 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'right' }}>{fmtM(co.revenue_m)}</div>
                      <div style={{ textAlign: 'right' }}><Badge type={co.type} /></div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textAlign: 'right' }}>{co.signal_source}</div>
                    </div>
                  );
                })}
              </Panel>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <AnalysisBlock label="TAM Derivation">
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{d.tam_rationale}</p>
                </AnalysisBlock>
                <AnalysisBlock label="SAM Rationale">
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{d.sam_rationale}</p>
                </AnalysisBlock>
                <AnalysisBlock label="SOM Rationale">
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{d.som_rationale}</p>
                </AnalysisBlock>
                <AnalysisBlock label={`Market Concentration · HHI ~${d.hhi_approx?.toLocaleString()}`}>
                  <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', margin: '10px 0 8px', border: '0.5px solid var(--border)' }}>
                    <div style={{ height: '100%', width: `${concPct}%`, background: concColor, borderRadius: 3 }} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{d.concentration_insight}</p>
                </AnalysisBlock>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <AnalysisBlock label="Key Data Signals Used">
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {d.key_signals.map((sig, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text2)', paddingLeft: 14, position: 'relative', lineHeight: 1.55 }}>
                        <span style={{ position: 'absolute', left: 0, color: 'var(--green)', fontSize: 10, top: 2 }}>→</span>
                        {sig}
                      </li>
                    ))}
                  </ul>
                </AnalysisBlock>
                <AnalysisBlock label="Methodology Caveats">
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {d.caveats.map((c, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text2)', paddingLeft: 14, position: 'relative', lineHeight: 1.55 }}>
                        <span style={{ position: 'absolute', left: 0, color: 'var(--amber)', fontSize: 10, fontWeight: 700, top: 1 }}>!</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </AnalysisBlock>
              </div>

              <div style={s.disclaimer}>
                All revenue figures sourced from SEC/EDGAR filings, Latka, Crunchbase/PitchBook public profiles, Sacra, LinkedIn headcount proxies, and credible journalism. Pune-based data aggregators excluded. Private company estimates carry ±30–50% uncertainty. Directional only — not investment advice.
              </div>

              <button onClick={reset} style={{ marginTop: 24, fontSize: 13 }}>← Run another analysis</button>
            </>
          );
        })()}
      </div>
    </>
  );
}
