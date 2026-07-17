import React, { useState, useEffect } from 'react';

const EMOJIS = ['🙁', '😐', '😔', '🫠', '😊'];
const STATES = ['Anxios', 'Agitat', 'Trist', 'Nostalgic', 'Calm', 'Singur', 'Obosit'];

export default function CheckIn({ navigateTo, user, ws, breathersCount }) {
  const [rating, setRating] = useState(3);
  const [state, setState] = useState('Calm');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  
  // Guided breathing states
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Pregătit/ă');
  const [secondsLeft, setSecondsLeft] = useState(8);

  // Fetch entries
  const fetchEntries = () => {
    if (!user) return;
    fetch(`/api/checkin?uid=${user.uid}`)
      .then(res => res.json())
      .then(data => setEntries(data.entries || []))
      .catch(err => console.error("Error loading journal checkins:", err));
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  // Handle submit check-in
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, rating, state, text })
    })
      .then(res => res.json())
      .then(() => {
        setText('');
        setSubmitted(true);
        fetchEntries();
      })
      .catch(err => console.error("Error checking in:", err))
      .finally(() => setSubmitting(false));
  };

  // Coordinated breathing cycle logic: 4s inhale, 4s exhale
  useEffect(() => {
    if (!breathingActive) {
      setBreathingPhase('Pregătit/ă');
      return;
    }

    // Inform backend that we started breathing
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'start_breathing' }));
    }

    let interval;
    let sec = 0;
    
    const cycle = () => {
      sec = (sec % 8) + 1;
      if (sec <= 4) {
        setBreathingPhase('Inspiră... 💨');
        setSecondsLeft(4 - sec + 1);
      } else {
        setBreathingPhase('Expiră... 💨');
        setSecondsLeft(8 - sec + 1);
      }
    };

    cycle();
    interval = setInterval(cycle, 1000);

    return () => {
      clearInterval(interval);
      // Inform backend we stopped breathing
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'stop_breathing' }));
      }
    };
  }, [breathingActive, ws]);

  const toggleBreathing = () => {
    setBreathingActive(!breathingActive);
  };

  // Adjust circle diameter based on active breathers count helper
  const scalingFactor = Math.min(1 + (breathersCount || 0) * 0.05, 1.4);

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>🩺 Check-in Emoțional de Noapte</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Notează-ți starea. Recomandăm acest ritual zilnic de 30 secunde. Înregistrările din jurnal se autodistrug după 7 zile ca să eliberezi mintea.
      </p>

      {/* Main check-in view */}
      <div className="view-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Cum te simți în acest moment?</h3>
          
          {/* Rating emoji selections */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {EMOJIS.map((emoji, idx) => (
              <button 
                type="button" 
                key={idx}
                onClick={() => setRating(idx + 1)}
                style={{
                  background: rating === idx + 1 ? 'rgba(124, 155, 181, 0.15)' : 'none',
                  border: rating === idx + 1 ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                  fontSize: '2rem', padding: '0.8rem', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', flex: 1, transition: 'all 0.2s'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Preset mood labels */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem' }}>Selectează starea cea mai apropiată:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {STATES.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setState(s)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s',
                    background: state === s ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    borderColor: 'transparent',
                    color: state === s ? 'var(--bg-primary)' : 'var(--color-text)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem' }}>Pune-ți gândurile în cuvinte (max 100 caractere):</h4>
            <textarea 
              className="textarea-field" 
              maxLength={100}
              placeholder="Ce se plimbă acum prin mintea ta?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ resize: 'none', height: '80px', marginBottom: '0.5rem' }}
            />
            <span style={{ fontSize: '0.75rem', float: 'right', color: 'var(--color-text-muted)' }}>
              {text.length}/100 caractere
            </span>
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%' }}>
            {submitting ? 'Se salvează...' : 'Confirmă starea de spirit'}
          </button>
        </form>
      </div>

      {/* Mini-game redirect card — shown after checkin */}
      {submitted && (
        <div className="view-card" style={{ marginBottom: '2rem', textAlign: 'center', borderLeft: '3px solid var(--accent-primary)', animation: 'fadeIn 0.5s ease-out' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            {{
              Anxios: '🌥️', Agitat: '💭', Trist: '🌱', Nostalgic: '🧊',
              Calm: '✨', Singur: '🏮', Obosit: '🐑'
            }[state] || '🎮'}
          </p>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Check-in salvat!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>
            Ai un mini-joc gândit special pentru starea ta{' '}
            <strong style={{ color: 'var(--accent-primary)' }}>{state}</strong>{' '}
            — scurt, fără presiune, cu buton "Sari peste" oricând.
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigateTo('minigame', { mood: state })}
            >
              Încearcă mini-jocul →
            </button>
            <button className="btn btn-secondary" onClick={() => setSubmitted(false)}>
              Rămân pe check-in
            </button>
          </div>
        </div>
      )}

      {/* Guided synchronized breathing circle */}
      <div className="view-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h3>🧘 Respirație Sincronizată Vizual</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>
          Cercul de respirație se dilată în timp ce inspiri și se contractă când expiri.
        </p>

        {breathersCount > 0 && (
          <div className="presence-pill" style={{ marginBottom: '1rem' }}>
            <span>●</span> {breathersCount} {breathersCount === 1 ? 'persoană respiră' : 'oameni respiră'} sincronizat cu tine acum
          </div>
        )}

        <div 
          className={`breathing-pulsar ${breathingActive ? 'active' : ''}`}
          onClick={toggleBreathing}
          style={{
            transform: breathingActive ? `scale(${scalingFactor})` : 'scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>{breathingPhase}</div>
            {breathingActive && <div style={{ fontSize: '1rem', marginTop: '0.2rem' }}>{secondsLeft}s</div>}
          </div>
        </div>

        <button className="btn" onClick={toggleBreathing} style={{ marginTop: '1rem' }}>
          {breathingActive ? 'Oprește Exercițiul' : 'Începe Exercițiul Ghidat'}
        </button>
      </div>

      {/* Self-destruct short journal list */}
      <div className="view-card">
        <h3>📓 Jurnal cu Autodistrugere</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Gândurile tale sunt curățate periodic din baza de date la 7 zile.
        </p>

        {entries.length === 0 ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', padding: '1.5rem 0', color: 'var(--color-text-muted)' }}>
            Nicio însemnare momentan.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {entries.map(e => (
              <div 
                key={e.id}
                style={{
                  background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${
                    e.rating >= 4 ? 'var(--accent-secondary)' : 
                    e.rating <= 2 ? 'var(--color-alert)' : 'var(--accent-primary)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: '600' }}>
                    Stare: {e.state} ({EMOJIS[e.rating - 1]})
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(e.timestamp).toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                </div>
                {e.text && <p style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>"{e.text}"</p>}
                
                {/* Expire tag */}
                <div style={{ fontSize: '0.75rem', color: '#DCA19A', fontStyle: 'italic', marginTop: '0.4rem', textAlign: 'right' }}>
                  * Acest gând va pleca în curând
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
