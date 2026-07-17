import React from 'react';

export default function Settings({ navigateTo, mascotEnabled, onToggleMascot, user }) {
  const regenerateAlias = () => {
    fetch('/api/auth/anonymous', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('pickl_uid', data.uid);
          localStorage.setItem('pickl_alias', data.alias);
          // Reload page to re-initialize WS connections
          window.location.reload();
        }
      })
      .catch(err => console.error("Error regenerating alias:", err));
  };

  const clearAllData = () => {
    if (confirm("Sigur dorești să ștergi toate datele locale? Setările de medicație și sesiunea ta curentă vor fi eliminate.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>⚙️ Setări și Confidențialitate</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Configurează comportamentul aplicației. Controlul datelor tale este 100% în mâinile tale.
      </p>

      {/* Mascot Settings */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <h3>🐱 Mascota Pickl (Pisica)</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
          O mică pisică discretă în colțul ecranului care îți oferă sfaturi calde, glume sau pur și simplu respiră cu tine.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Mascotă pisică activă pe ecran: <strong style={{ color: mascotEnabled ? 'var(--accent-secondary)' : 'var(--color-text-muted)' }}>{mascotEnabled ? 'DA' : 'NU'}</strong></span>
          <button 
            onClick={() => onToggleMascot(!mascotEnabled)}
            className="btn"
            style={{
              background: mascotEnabled ? 'var(--bg-tertiary)' : 'var(--accent-secondary)',
              color: mascotEnabled ? 'var(--color-text)' : 'var(--bg-primary)',
              borderColor: 'transparent', width: '120px'
            }}
          >
            {mascotEnabled ? 'Dezactivează' : 'Activează'}
          </button>
        </div>
      </div>

      {/* Profile & Anonymous ID */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <h3>🛡️ Autentificare Anonimă</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Numele tău real și adresa IP nu sunt salvate niciodată pe serverele publice. Ești identificat prin aliasuri temporare.
        </p>

        <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            Aliasul tău curent: <strong style={{ color: 'var(--accent-primary)' }}>{user?.alias || '...'}</strong>
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ID Sesiune: <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{user?.uid || '...'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ flex: 1, fontSize: '0.85rem' }} onClick={regenerateAlias}>
            🔄 Schimbă Aliasul Acum
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-alert)' }} onClick={clearAllData}>
            Șterge Sesiunea complet
          </button>
        </div>
      </div>

      {/* Security disclosures */}
      <div className="view-card">
        <h3>Norme de Siguranță</h3>
        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Chat-ul de suport 1-la-1 este complet criptat/efemer în RAM-ul serverului. La ieșire, mesajele se șterg în totalitate.</li>
          <li>Check-in-ul tău emoțional și jurnalul personal se autodistrug după exact 7 zile.</li>
          <li>Această aplicație este o platformă complementară; nu înlocuiește servicii medicale sau de criză.</li>
        </ul>
      </div>

    </div>
  );
}
