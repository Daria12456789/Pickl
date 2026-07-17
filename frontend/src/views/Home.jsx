import React from 'react';

export default function Home({ navigateTo, onlineCount }) {
  const menuItems = [
    { id: 'checkin', title: 'Check-in Emoțional', icon: '🩺', desc: 'Împărtășește-ți starea și fă un micro-exercițiu.' },
    { id: 'chat', title: 'Buddy Chat & AI', icon: '💬', desc: 'Discută anonim cu altcineva treaz sau cu AI Companion.' },
    { id: 'feed', title: 'Ecoul Zidului', icon: '📣', desc: 'Mesaje anonime scurte și suport de la comunitate.' },
    { id: 'study', title: 'Buddy4Study', icon: '📚', desc: 'Învață anonim și împarte cursuri cu alți studenți treji.' },
    { id: 'meds', title: 'Evidență Medicație', icon: '💊', desc: 'Jurnalul tău personal și reminder de tratament.' },
    { id: 'sounds', title: 'Sleepwave Symphony', icon: '🎵', desc: 'Mixer ambiental colectiv în timp real.' },
    { id: 'echoes', title: 'Capsula Timpului', icon: '✉️', desc: 'Lasă un gând nocturn sau citește gândurile altora.' },
    { id: 'settings', title: 'Setări Mascotă', icon: '⚙️', desc: 'Configurare mascotă pisică și preferințe.' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>Noptieră</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontStyle: 'italic' }}>
          Companionul tău pentru orele liniștite sau grele ale nopții.
        </p>
      </header>

      {/* Aggregated presence info */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid rgba(143, 174, 155, 0.15)',
        borderRadius: 'var(--radius-lg)', padding: '1.2rem 1.5rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h4 style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Prezență Silențioasă</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Nu ești singur(ă) în această noapte. Ne ținem companie în tăcere.
          </p>
        </div>
        <div style={{
          background: 'rgba(143, 174, 155, 0.12)', border: '1px solid var(--accent-secondary)',
          color: 'var(--accent-secondary)', padding: '0.6rem 1rem', borderRadius: '50px',
          fontWeight: '700', fontSize: '1.1rem'
        }}>
          {onlineCount} {onlineCount === 1 ? 'utilizator activ' : 'utilizatori activi'}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(124, 155, 181, 0.05)'
      }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1rem', marginLeft: '0.5rem' }}>
          Ce ai dori să faci acum?
        </h3>
        
        <div className="menu-grid">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              className="menu-button"
              onClick={() => navigateTo(item.id)}
            >
              <span className="menu-button-icon">{item.icon}</span>
              <span className="menu-button-title">{item.title}</span>
              <span style={{ fontSize: '0.75rem', marginTop: '0.3rem', opacity: 0.8 }}>{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
