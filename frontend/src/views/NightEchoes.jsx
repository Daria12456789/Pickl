import React, { useState, useEffect } from 'react';

export default function NightEchoes({ navigateTo }) {
  const [echoText, setEchoText] = useState('');
  const [echoes, setEchoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hour configurations
  const currentHour = new Date().getHours();
  const [selectedHour, setSelectedHour] = useState(currentHour);

  // Load echoes for targetHour
  const fetchEchoes = (hr) => {
    setLoading(true);
    fetch(`/api/echo?hour=${hr}`)
      .then(res => res.json())
      .then(data => setEchoes(data.echoes || []))
      .catch(err => console.error("Error loading echoes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEchoes(selectedHour);
  }, [selectedHour]);

  const handleSubmitEcho = (e) => {
    e.preventDefault();
    if (!echoText.trim()) return;

    setSubmitting(true);
    fetch('/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: echoText, hour: selectedHour })
    })
      .then(res => res.json())
      .then(() => {
        setEchoText('');
        fetchEchoes(selectedHour);
      })
      .catch(err => console.error("Error creating echo:", err))
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>✉️ Ecoul Nopții - Capsula Timpului</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Gândurile scrise aici nu sunt postate instantaneu. Ele apar doar utilizatorilor care accesează aplicația la aceeași oră a nopții ca tine.
      </p>

      {/* Hour filter slider */}
      <div className="view-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>Alege ora pe care dorești să o asculți sau în care postezi:</h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
          <span>🕒 {selectedHour}:00 - {selectedHour + 1}:00</span>
          {selectedHour === currentHour && (
            <span className="presence-pill" style={{ background: 'rgba(143,174,155,0.15)', color: 'var(--accent-secondary)', fontSize: '0.72rem' }}>
              Ora ta curentă
            </span>
          )}
        </div>

        <input 
          type="range"
          min="0"
          max="23"
          value={selectedHour}
          onChange={(e) => setSelectedHour(parseInt(e.target.value))}
          style={{ width: '100%', marginTop: '1rem', accentColor: 'var(--accent-primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Input container */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSubmitEcho}>
          <textarea
            className="textarea-field"
            placeholder={`Lasă un gând nocturn pentru cei care vor fi treji la ora ${selectedHour}:00...`}
            value={echoText}
            onChange={(e) => setEchoText(e.target.value)}
            maxLength={180}
            required
            style={{ resize: 'none', height: '80px', marginBottom: '0.5rem' }}
          />
          <button type="submit" disabled={submitting || !echoText.trim()} className="btn btn-primary" style={{ width: '100%' }}>
            {submitting ? 'Se configurează capsula...' : 'Lansează mesajul în timp'}
          </button>
        </form>
      </div>

      {/* Display messages */}
      <div className="view-card">
        <h3>🌌 Gânduri captate la ora {selectedHour}:00</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: '1rem' }}>
          Mesaje anonime lăsate în urmă de călători temporali.
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', padding: '1.5rem 0', color: 'var(--color-text-muted)' }}>
            Se citesc ecurile...
          </p>
        ) : echoes.length === 0 ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
            Zidul timpului este curat la această oră. Fii tu primul care lasă un gând.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {echoes.map(e => (
              <div 
                key={e.id}
                style={{
                  background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(124, 155, 181, 0.05)', borderLeft: '3px solid var(--accent-primary)',
                  position: 'relative'
                }}
              >
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  "{e.text}"
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '0.4rem' }}>
                  * Scris la data de: {new Date(e.timestamp).toLocaleDateString('ro-RO')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
