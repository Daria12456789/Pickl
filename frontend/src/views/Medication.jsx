import React, { useState, useEffect } from 'react';

export default function Medication({ navigateTo, user }) {
  const [meds, setMeds] = useState([]);
  const [medName, setMedName] = useState('');
  const [medTimes, setMedTimes] = useState(''); // e.g. "08:00, 20:00"
  const [submitting, setSubmitting] = useState(false);

  // Active alarms trigger alerts on screen
  const [activeAlerts, setActiveAlerts] = useState([]);

  const fetchMeds = () => {
    if (!user) return;
    fetch(`/api/meds?uid=${user.uid}`)
      .then(res => res.json())
      .then(data => setMeds(data.list || []))
      .catch(err => console.error("Error fetching medications:", err));
  };

  useEffect(() => {
    fetchMeds();
  }, [user]);

  // Request browser permission for system notifications
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        alert(permission === 'granted' 
          ? 'Permisiune acordată! Vei primi notificări la orele programate dacă aplicația este deschisă.' 
          : 'Permisiune refuzată. Poți primi totuși alerte vizuale în cadrul aplicației.'
        );
      });
    } else {
      alert('Sistemul tău nu suportă notificări de sistem.');
    }
  };

  const handleAddMed = (e) => {
    e.preventDefault();
    if (!medName.trim() || !medTimes.trim() || !user) return;

    // Parse times comma-separated (e.g. 08:30, 14:00)
    const timesArray = medTimes.split(',')
      .map(t => t.trim())
      .filter(t => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t)); // Basic HH:MM check

    if (timesArray.length === 0) {
      alert("Te rugăm să introduci orele în format corect HH:MM, separate prin virgulă (ex: 08:00, 20:30).");
      return;
    }

    const newMed = {
      id: Math.random().toString(36).substr(2, 9),
      name: medName,
      times: timesArray,
      history: [] // entries record of taking { date: 'YYYY-MM-DD', time: 'HH:MM', taken: true }
    };

    const updatedMeds = [...meds, newMed];
    saveMedsToApi(updatedMeds);
  };

  const saveMedsToApi = (updatedList) => {
    setSubmitting(true);
    fetch('/api/meds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, list: updatedList })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMeds(data.list);
          setMedName('');
          setMedTimes('');
        }
      })
      .catch(err => console.error("Error saving medication agenda:", err))
      .finally(() => setSubmitting(false));
  };

  const handleDeleteMed = (id) => {
    const updated = meds.filter(m => m.id !== id);
    saveMedsToApi(updated);
  };

  // Mark medication dose as taken for the day
  const handleMarkTaken = (medId, timeStr) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = meds.map(m => {
      if (m.id === medId) {
        const alreadyIndex = m.history.findIndex(h => h.date === today && h.time === timeStr);
        if (alreadyIndex !== -1) {
          // toggle it
          m.history[alreadyIndex].taken = !m.history[alreadyIndex].taken;
        } else {
          m.history.push({ date: today, time: timeStr, taken: true });
        }
      }
      return m;
    });
    saveMedsToApi(updated);
    // Dismiss visual alert if dismissing for this med
    setActiveAlerts(prev => prev.filter(al => !(al.id === medId && al.time === timeStr)));
  };

  // Check alarm times every 30 seconds
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHrStr = String(now.getHours()).padStart(2, '0');
      const currentMinStr = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHrStr}:${currentMinStr}`;
      const todayDateStr = now.toISOString().split('T')[0];

      meds.forEach(m => {
        m.times.forEach(t => {
          if (t === currentTimeString) {
            // Check if already taken today
            const alreadyTaken = m.history.some(h => h.date === todayDateStr && h.time === t && h.taken);
            if (!alreadyTaken) {
              // Trigger visual page overlay alert if not already showing
              setActiveAlerts(prev => {
                const alExists = prev.some(p => p.id === m.id && p.time === t);
                if (alExists) return prev;
                
                // Trigger system notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Reminder Medicație Noptieră', {
                    body: `Este timpul să îți iei: ${m.name} la ora ${t}.`,
                    icon: '/icon-192.png'
                  });
                }

                return [...prev, { id: m.id, name: m.name, time: t }];
              });
            }
          }
        });
      });
    };

    const checker = setInterval(checkAlarms, 30000); // Check every 30 seconds
    return () => clearInterval(checker);
  }, [meds]);

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>💊 Jurnal Personal Evidență Medicație</h2>
      
      {/* Disclaimer Medical Obligatoriu */}
      <div style={{
        background: 'rgba(196, 114, 106, 0.12)', border: '1px dashed var(--color-alert)',
        color: '#DCA19A', padding: '1rem', borderRadius: 'var(--radius-md)',
        fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: '1.4'
      }}>
        ⚠️ <strong>LIMITARE DE RESPONSABILITATE:</strong> Această pagină este destinată exclusiv evidenței personale realizată manual de utilizator. Aplicația nu oferă recomandări medicale, interpretări clinice, sugestii de dozaj sau tratament. Dacă aveți întrebări despre rețete sau simptome, consultați un medic sau un farmacist autorizat.
      </div>

      {/* active alarms alert panel */}
      {activeAlerts.length > 0 && (
        <div style={{
          background: 'var(--color-alert)', color: '#fff', padding: '1.2rem',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.8rem', animation: 'fadeIn 0.3s ease'
        }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>⏰ Reminder Alertă Alarmă!</h3>
          {activeAlerts.map(alertItem => (
            <div key={`${alertItem.id}-${alertItem.time}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.8rem', borderRadius: 'var(--radius-md)' }}>
              <span>Este timpul să iei: <strong>{alertItem.name}</strong> la ora <strong>{alertItem.time}</strong></span>
              <button 
                className="btn" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-secondary)', borderColor: 'transparent', color: 'var(--bg-primary)'}}
                onClick={() => handleMarkTaken(alertItem.id, alertItem.time)}
              >
                Am luat doza ✅
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notification requests */}
      <div className="view-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '0.92rem' }}>Remindre Push active pe ecran</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Permite trimiterea notificarilor de sistem.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }} onClick={requestNotificationPermission}>
          Activează alerte push
        </button>
      </div>

      {/* Medication adder form */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAddMed}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Adaugă un tratament nou</h3>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Nume medicament (ex: Paracetamol)"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              required
              style={{ marginBottom: 0, flex: 2 }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Ore (ex: 08:00, 20:00)"
              value={medTimes}
              onChange={(e) => setMedTimes(e.target.value)}
              required
              style={{ marginBottom: 0, flex: 1 }}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn" style={{ width: '100%' }}>
            {submitting ? 'Se înregistrează...' : 'Adaugă în Registru'}
          </button>
        </form>
      </div>

      {/* Register List */}
      <div className="view-card">
        <h3>📋 Planificatorul Meu Zilnic</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Jurnalul tău de evidență manuală. Bifează o doză pe măsură ce o iei.
        </p>

        {meds.length === 0 ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', padding: '1.5rem 0', color: 'var(--color-text-muted)' }}>
            Niciun medicament înregistrat momentan.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {meds.map(m => {
              const todayStr = new Date().toISOString().split('T')[0];
              return (
                <div key={m.id} style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', postion: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-primary)' }}>💊 {m.name}</strong>
                    <button 
                      className="btn" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--color-alert)', background: 'none', borderColor: 'transparent' }}
                      onClick={() => handleDeleteMed(m.id)}
                    >
                      Șterge
                    </button>
                  </div>
                  
                  {/* Times checks */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
                    {m.times.map(t => {
                      const doseTaken = m.history.some(h => h.date === todayStr && h.time === t && h.taken);
                      return (
                        <button
                          key={t}
                          onClick={() => handleMarkTaken(m.id, t)}
                          style={{
                            padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            fontSize: '0.8rem', border: '1px solid rgba(124, 155, 181, 0.15)',
                            background: doseTaken ? 'rgba(143, 174, 155, 0.15)' : 'none',
                            color: doseTaken ? 'var(--accent-secondary)' : 'var(--color-text-muted)',
                            transition: 'all 0.2s', flex: '1 0 80px', textAlign: 'center'
                          }}
                        >
                          🕒 {t} {doseTaken ? '✔️ Bifată' : '○ Bifează'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
