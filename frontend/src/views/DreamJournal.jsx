import React, { useState, useEffect } from 'react';

const CRISIS_KEYWORDS = ['sinucid', 'mor', 'dispar', 'terminat', 'nu mai pot', 'autovat', 'rănesc'];

export default function DreamJournal({ navigateTo, user }) {
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reflection, setReflection] = useState(null);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [saveToJournal, setSaveToJournal] = useState(true);
  const [savedEntries, setSavedEntries] = useState([]);
  const [tab, setTab] = useState('new'); // 'new' | 'journal'

  const fetchEntries = () => {
    if (!user) return;
    fetch(`/api/dreams?uid=${user.uid}`)
      .then(r => r.json())
      .then(d => setSavedEntries(d.entries || []))
      .catch(() => {});
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const checkCrisis = (text) =>
    CRISIS_KEYWORDS.some(kw => text.toLowerCase().includes(kw));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dreamText.trim() || loading) return;

    if (checkCrisis(dreamText)) {
      setCrisisDetected(true);
      return;
    }
    setCrisisDetected(false);
    setLoading(true);
    setReflection(null);

    const systemPrompt = `Ești un asistent blând de auto-reflecție și jurnalizare simbolică. \
Utilizatorul ți-a descris un vis. \
Oferi o reflecție SIMBOLICĂ și CREATIVĂ — niciodată psihologică sau clinică. \
Regulă strictă: nu afirma niciodată că un vis "arată că suferi de", nu faci predicții, \
nu conectezi visul cu un diagnostic sau stare de sănătate mintală. \
Ton: cald, curios, deschis la mai multe interpretări. \
Folosești formulări ca "poate fi văzut ca...", "este posibil să reflecte...", "adesea în simbolistica viselor...". \
Răspunzi în română, în 3-5 propoziții scurte, cu un ton poetic și cald.`;

    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Visul meu: "${dreamText}"` }
          ]
        })
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || getFallbackReflection();
      setReflection(text);

      if (saveToJournal && user) {
        await fetch('/api/dreams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, dream: dreamText, reflection: text })
        });
        fetchEntries();
      }
    } catch {
      setReflection(getFallbackReflection());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackReflection = () => {
    const fallbacks = [
      "Visele ne poartă adesea prin spații ale minții pe care nu le vizităm în lumina zilei. Imaginile care au rămas cu tine pot fi un ecou al unor gânduri în curs de procesare.",
      "Un vis ca acesta poate fi văzut ca o hartă interioară — nu un mesaj fix, ci un peisaj de explorat cu blândețe și curiozitate.",
      "Simbolurile din vise sunt personale și fluide. Poate fi interesant să notezi cum te-a făcut să te simți, nu neapărat ce a 'însemnat'.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>🌙 Interpretare Simbolică Vise</h2>

      {/* Disclaimer */}
      <div style={{
        background: 'rgba(124,155,181,0.07)', border: '1px solid rgba(124,155,181,0.15)',
        borderRadius: 'var(--radius-md)', padding: '0.8rem 1rem',
        fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: '1.5'
      }}>
        ⚠️ <strong>Notă:</strong> Reflecțiile generate sunt <strong>simbolice și creative</strong>, nu interpretări psihologice sau clinice. Nu înlocuiesc consultarea unui specialist și nu conțin predicții sau diagnostice.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['new', '✍️ Vis Nou'], ['journal', '📓 Jurnalul Meu']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="btn"
            style={{ flex: 1, background: tab === id ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: tab === id ? 'var(--bg-primary)' : 'var(--color-text)', borderColor: 'transparent' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── NEW DREAM ── */}
      {tab === 'new' && (
        <>
          {crisisDetected && (
            <div style={{ background: 'rgba(196,114,106,0.15)', border: '1px solid var(--color-alert)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.2rem' }}>
              <strong style={{ color: '#DCA19A' }}>💙 Suntem aici.</strong>
              <p style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>
                Dacă ceea ce ai scris reflectă o suferință reală, te invităm să apeși butonul de mai jos. Ajutorul este gratuit și disponibil acum.
              </p>
              <button className="btn btn-primary" style={{ background: 'var(--color-alert)', borderColor: 'var(--color-alert)' }}
                onClick={() => navigateTo('home')}>
                Am nevoie de ajutor acum 🚨
              </button>
            </div>
          )}

          <div className="view-card">
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>Descrie visul tău</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Scrie liber — culori, personaje, senzații, fragmente. Nu trebuie să fie un text complet.
              </p>

              <textarea
                className="textarea-field"
                placeholder="În vis eram într-un loc necunoscut, dar familiar în același timp..."
                value={dreamText}
                onChange={e => { setDreamText(e.target.value); if (crisisDetected && !checkCrisis(e.target.value)) setCrisisDetected(false); }}
                style={{ resize: 'vertical', minHeight: '120px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={saveToJournal} onChange={e => setSaveToJournal(e.target.checked)} />
                  Salvează în jurnalul meu privat (șters automat în 14 zile)
                </label>
              </div>

              <button type="submit" disabled={loading || !dreamText.trim()} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? '✨ Se generează reflecția...' : '🔮 Generează Reflecție Simbolică'}
              </button>
            </form>
          </div>

          {/* Reflection result */}
          {reflection && (
            <div className="view-card" style={{ marginTop: '1.2rem', borderLeft: '3px solid var(--accent-primary)', animation: 'fadeIn 0.5s ease-out' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '0.8rem' }}>
                🌙 Reflecție Simbolică
              </h4>
              <p style={{ fontSize: '0.92rem', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--color-text)' }}>
                {reflection}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.6rem' }}>
                * Aceasta este o reflecție simbolică generată de AI, nu o interpretare psihologică sau clinică.
              </p>
              <button className="btn" style={{ marginTop: '0.8rem', fontSize: '0.82rem' }} onClick={() => { setDreamText(''); setReflection(null); }}>
                Descrie un alt vis
              </button>
            </div>
          )}
        </>
      )}

      {/* ── JOURNAL ── */}
      {tab === 'journal' && (
        <div className="view-card">
          <h3 style={{ marginBottom: '1rem' }}>📓 Jurnalul Tău de Vise</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>
            Intrările sunt private și se șterg automat după 14 zile. Nu sunt vizibile altor utilizatori.
          </p>

          {savedEntries.length === 0 ? (
            <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
              Niciun vis salvat încă. Descrie primul vis și bifează "Salvează în jurnal".
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedEntries.map(e => (
                <div key={e.id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    <span>🌙 Vis salvat</span>
                    <span>{new Date(e.timestamp).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', marginBottom: '0.8rem', fontStyle: 'italic', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.6rem' }}>
                    "{e.dream}"
                  </p>
                  {e.reflection && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                      {e.reflection}
                    </p>
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#DCA19A', fontStyle: 'italic', marginTop: '0.5rem', textAlign: 'right' }}>
                    * Se șterge automat în 14 zile
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
