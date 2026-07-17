import React, { useState, useEffect, useRef } from 'react';
import Home from './views/Home.jsx';
import CheckIn from './views/CheckIn.jsx';
import BuddyChat from './views/BuddyChat.jsx';
import SocialFeed from './views/SocialFeed.jsx';
import Buddy4Study from './views/Buddy4Study.jsx';
import Medication from './views/Medication.jsx';
import SleepwaveSymphony from './views/SleepwaveSymphony.jsx';
import NightEchoes from './views/NightEchoes.jsx';
import Settings from './views/Settings.jsx';
import MiniGame from './views/MiniGame.jsx';
import DreamJournal from './views/DreamJournal.jsx';
import OfflineGame from './components/OfflineGame.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const [viewParams, setViewParams] = useState({});
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Settings & Widgets
  const [mascotEnabled, setMascotEnabled] = useState(() => {
    return localStorage.getItem('mascotEnabled') !== 'false';
  });
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [mascotSaying, setMascotSaying] = useState('');
  const [mascotPos, setMascotPos] = useState(() => {
    const saved = localStorage.getItem('mascotPos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { x: window.innerWidth - 100, y: window.innerHeight - 240 };
  });

  const dragStartRef = useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, hasMoved: false });

  // Handle dragging for the mascot
  const handleMascotPointerDown = (e) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    dragStartRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      offsetX: clientX - mascotPos.x,
      offsetY: clientY - mascotPos.y,
      hasMoved: false
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleMascotPointerMove = (e) => {
    if (!dragStartRef.current.isDragging) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const dx = clientX - dragStartRef.current.startX;
    const dy = clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragStartRef.current.hasMoved = true;
    }

    // Constrain inside viewport
    const newX = Math.max(10, Math.min(window.innerWidth - 80, clientX - dragStartRef.current.offsetX));
    const newY = Math.max(10, Math.min(window.innerHeight - 150, clientY - dragStartRef.current.offsetY));

    setMascotPos({ x: newX, y: newY });
  };

  const handleMascotPointerUp = (e) => {
    if (!dragStartRef.current.isDragging) return;
    dragStartRef.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    localStorage.setItem('mascotPos', JSON.stringify(mascotPos));

    if (!dragStartRef.current.hasMoved) {
      triggerMascotTap();
    }
  };
  
  // Realtime counters
  const [onlineCount, setOnlineCount] = useState(1);
  const [breathersCount, setBreathersCount] = useState(0);
  const [soundCounts, setSoundCounts] = useState({ rain: 0, waves: 0, piano: 0, crickets: 0 });
  const [peerMessage, setPeerMessage] = useState(null);

  const socketRef = useRef(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Perform anonymous login
  useEffect(() => {
    let localUid = localStorage.getItem('pickl_uid');
    let localAlias = localStorage.getItem('pickl_alias');

    if (localUid && localAlias) {
      setUser({ uid: localUid, alias: localAlias });
    } else {
      fetch('/api/auth/anonymous', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('pickl_uid', data.uid);
            localStorage.setItem('pickl_alias', data.alias);
            setUser({ uid: data.uid, alias: data.alias });
          }
        })
        .catch(err => console.error("Error creating anonymous session:", err));
    }
  }, []);

  // Configure WebSockets
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWS = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to websocket stream');
        ws.send(JSON.stringify({ type: 'init', uid: user.uid, alias: user.alias }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'presence_update') {
            setOnlineCount(data.onlineCount);
            setBreathersCount(data.breathersCount);
            setSoundCounts(data.soundCounts || { rain: 0, waves: 0, piano: 0, crickets: 0 });
          } else {
            // Forward other events to listeners if registered
            if (peerMessageListener.current) {
              peerMessageListener.current(data);
            }
          }
        } catch (e) {
          console.error("Error parsing websocket frame:", e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Websocket disconnected. Reconnecting in 3s...');
        setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [user]);

  // Listener pattern for active buddy chats
  const peerMessageListener = useRef(null);

  // Hourly mascot chat messages
  useEffect(() => {
    if (!mascotEnabled) return;

    const phrases = [
      "Miau! Ai respirat adânc în ultima oră? 🐾",
      "Sunt aici cu tine. Noaptea e doar o trecere temporară către o nouă zi. 🌙",
      "Știai că greierii cântă mai repede când este cald afară? Încearcă sunetul de greier din Sleepwave Symphony!",
      "Dacă simți că gândurile te copleșesc, te poți descărca în jurnalul cu autodistrugere. Rămâne doar între noi.",
      "Miau, te-ai hidratat cum trebuie la orele astea? Bea o gură mică de apă. 💧",
      "Să nu pui presiune pe tine să dormi neapărat. Doar odihnește-ți corpul în liniște.",
      "Un prieten este disponibil în Buddy Chat dacă dorești să împărtășești un gând scurt."
    ];

    const pickPhrase = () => {
      const idx = Math.floor(Math.random() * phrases.length);
      setMascotSaying(phrases[idx]);
      // clear bubble after 6 seconds
      setTimeout(() => setMascotSaying(''), 7000);
    };

    // Pick first phrase
    setTimeout(pickPhrase, 3000);

    const interval = setInterval(pickPhrase, 60000 * 5); // display phrase every 5 mins
    return () => clearInterval(interval);
  }, [mascotEnabled]);

  // Trigger mascot manually when tapped
  const triggerMascotTap = () => {
    // Attempt to call generator or pull random comforting phrase
    fetch('/api/ai/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Generate a short 1-sentence funny cat joke or warm greeting. Keep it under 60 characters.' }]
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.choices && data.choices[0].message) {
          setMascotSaying(data.choices[0].message.content);
        } else {
          setMascotSaying("Miau! Mă bucur că te-am simțit aproape. 🐾");
        }
        setTimeout(() => setMascotSaying(''), 6000);
      })
      .catch(() => {
        setMascotSaying("Purr... Sunt aici, respirăm împreună. 🐱");
        setTimeout(() => setMascotSaying(''), 5000);
      });
  };

  // Nav actions
  const navigateTo = (viewName, params = {}) => {
    setView(viewName);
    setViewParams(params);
    window.scrollTo(0, 0);
  };

  const notifyMascotToggle = (val) => {
    setMascotEnabled(val);
    localStorage.setItem('mascotEnabled', val);
  };

  // Switch views
  const renderView = () => {
    // If we're offline, show the offline runner/game view (unless manually overriding for offline views)
    if (!isOnline) {
      return (
        <OfflineGame 
          onBackToHome={() => setIsOnline(true)} 
        />
      );
    }

    switch (view) {
      case 'home':
        return <Home navigateTo={navigateTo} onlineCount={onlineCount} />;
      case 'checkin':
        return <CheckIn navigateTo={navigateTo} user={user} ws={socketRef.current} breathersCount={breathersCount} />;
      case 'chat':
        return (
          <BuddyChat 
            navigateTo={navigateTo} 
            user={user} 
            ws={socketRef.current} 
            peerMessageListener={peerMessageListener} 
          />
        );
      case 'feed':
        return <SocialFeed navigateTo={navigateTo} user={user} />;
      case 'study':
        return <Buddy4Study navigateTo={navigateTo} user={user} />;
      case 'meds':
        return <Medication navigateTo={navigateTo} user={user} />;
      case 'sounds':
        return (
          <SleepwaveSymphony 
            navigateTo={navigateTo} 
            ws={socketRef.current} 
            onlineCount={onlineCount} 
            soundCounts={soundCounts} 
          />
        );
      case 'echoes':
        return <NightEchoes navigateTo={navigateTo} />;
      case 'minigame':
        return (
          <MiniGame
            mood={viewParams.mood || 'Calm'}
            onExit={() => navigateTo('checkin')}
            user={user}
            ws={socketRef.current}
            onlineCount={onlineCount}
          />
        );
      case 'dreams':
        return <DreamJournal navigateTo={navigateTo} user={user} />;
      case 'settings':
        return (
          <Settings 
            navigateTo={navigateTo} 
            mascotEnabled={mascotEnabled} 
            onToggleMascot={notifyMascotToggle} 
            user={user}
          />
        );
      default:
        return <Home navigateTo={navigateTo} onlineCount={onlineCount} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation for Desktop */}
      {isOnline && (
        <aside className="sidebar">
          <div className="brand-title" onClick={() => navigateTo('home')} style={{ cursor: 'pointer' }}>
            <span>🌙 Pickl</span>
          </div>
          <ul className="nav-links">
            <li className={`nav-item ${view === 'home' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('home')}>🏠 Meniu Principal</button>
            </li>
            <li className={`nav-item ${view === 'checkin' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('checkin')}>🩺 Check-in Emoțional</button>
            </li>
            <li className={`nav-item ${view === 'chat' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('chat')}>💬 Buddy Chat & AI</button>
            </li>
            <li className={`nav-item ${view === 'feed' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('feed')}>📣 Ecoul Zidului</button>
            </li>
            <li className={`nav-item ${view === 'study' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('study')}>📚 Buddy4Study</button>
            </li>
            <li className={`nav-item ${view === 'meds' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('meds')}>💊 Evidență Medicație</button>
            </li>
            <li className={`nav-item ${view === 'sounds' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('sounds')}>🎵 Sleepwave Symphony</button>
            </li>
            <li className={`nav-item ${view === 'echoes' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('echoes')}>✉️ Capsula Timpului</button>
            </li>
            <li className={`nav-item ${view === 'settings' ? 'active' : ''}`}>
              <button onClick={() => navigateTo('settings')}>⚙️ Setări</button>
            </li>
          </ul>

          <div style={{ marginTop: 'auto', padding: '1rem 0' }}>
            <div className="presence-pill">
              <span>●</span> {onlineCount} oameni treji acum
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className="main-content">
        {renderView()}
      </main>

      {/* Bottom Nav for Mobile */}
      {isOnline && (
        <nav className="bottom-nav">
          <button className={`bottom-nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
            <span className="bottom-nav-icon">🏠</span>
            <span>Acasă</span>
          </button>
          <button className={`bottom-nav-item ${['checkin', 'sounds'].includes(view) ? 'active' : ''}`} onClick={() => navigateTo('checkin')}>
            <span className="bottom-nav-icon">🩺</span>
            <span>Calm</span>
          </button>
          <button className={`bottom-nav-item ${['chat', 'feed'].includes(view) ? 'active' : ''}`} onClick={() => navigateTo('chat')}>
            <span className="bottom-nav-icon">💬</span>
            <span>Social</span>
          </button>
          <button className={`bottom-nav-item ${['study', 'meds'].includes(view) ? 'active' : ''}`} onClick={() => navigateTo('study')}>
            <span className="bottom-nav-icon">📚</span>
            <span>Utile</span>
          </button>
          <button className={`bottom-nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => navigateTo('settings')}>
            <span className="bottom-nav-icon">⚙️</span>
            <span>Setări</span>
          </button>
        </nav>
      )}

      {/* Crisis Help Overlay Trigger */}
      <button className="crisis-btn" onClick={() => setCrisisOpen(true)}>
        🚨 Ajutor Acum
      </button>

      {/* Crisis Modal Dialog */}
      {crisisOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 22, 32, 0.9)', backdropFilter: 'blur(8px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--color-alert)',
            borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%',
            padding: '2rem', boxShadow: 'var(--shadow-md)', position: 'relative'
          }}>
            <button 
              onClick={() => setCrisisOpen(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem', background: 'none',
                border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)'
              }}
            >
              ✕
            </button>
            <h2 style={{ color: 'var(--color-alert)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🚨 Secțiune de Sprijin și Ajutor Uman Real
            </h2>
            <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Această aplicație este un instrument digital de sprijin și <strong>nu oferă diagnostic sau tratament medical</strong>. Dacă treci printr-o stare critică, te rugăm să folosești una din resursele de mai jos. Nimeni nu te va judeca, iar ajutorul este gratuit și adesea anonim.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Crisis Line */}
              <div style={{ border: '1px solid rgba(124, 155, 181, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.3rem' }}>📞 Criză Emoțională & Suicid</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Pentru susținere emoțională imediată și prevenție în momente de cumpănă:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href="tel:0800801200" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    Sună 0800 801 200 (România)
                  </a>
                  <a href="tel:112" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    Urgențe 112
                  </a>
                </div>
              </div>

              {/* Abuse Line */}
              <div style={{ border: '1px solid rgba(124, 155, 181, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: '#DCA19A', marginBottom: '0.3rem' }}>🛡️ Raportare Abuz (Domestic, Academic sau Relații)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Dacă ești victimă a abuzului, agresiunii fizice sau verbale sau a hărțuirii:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a href="tel:0800500333" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#C4726A', borderColor: '#C4726A' }}>
                    Linia Națională Violenta Domestică (0800 500 333)
                  </a>
                  <a href="https://www.politiaromana.ro" target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    Poliția Română (Raportare online / Suport)
                  </a>
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                  *Notă: Poliția va interveni în cazuri urgențe. Resursele asociațiilor neguvernamentale oferă adăpost temporar și consiliere juridică gratuită.
                </p>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setCrisisOpen(false)}>
              Înapoi în aplicație
            </button>
          </div>
        </div>
      )}

      {/* Mascot widget floating draggable */}
      {isOnline && mascotEnabled && (
        <div 
          className="mascot-widget-wrapper draggable"
          style={{ 
            position: 'fixed',
            left: `${mascotPos.x}px`, 
            top: `${mascotPos.y}px`,
            cursor: dragStartRef.current.isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            zIndex: 9998
          }}
          onPointerDown={handleMascotPointerDown}
          onPointerMove={handleMascotPointerMove}
          onPointerUp={handleMascotPointerUp}
        >
          {mascotSaying && (
            <div 
              className="mascot-bubble" 
              onClick={(e) => { e.stopPropagation(); setMascotSaying(''); }}
              style={{
                position: 'absolute',
                bottom: '100%',
                right: '0',
                marginBottom: '8px',
                width: '180px',
                pointerEvents: 'auto'
              }}
            >
              {mascotSaying}
            </div>
          )}
          <div className="mascot-cat-body">
            <div className="cat-head">🐱</div>
            <div className="cat-torso">
              <span className="cat-heart">🤍</span>
              <div className="cat-legs">
                <span>🐾</span>
                <span>🐾</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
