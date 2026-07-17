import React, { useState, useEffect, useRef, useCallback } from 'react';

// Warm quotes for Nostalgic Memory game
const NOSTALGIC_QUOTES = [
  "Unele lucruri rămân cu noi pentru că merită să rămână.",
  "Trecutul nu dispare — el devine parte din cine ești azi.",
  "Amintirile bune sunt daruri pe care ni le facem nouă înșine.",
  "Timpul trece, dar dragostea rămâne scrisă în noi.",
  "Tot ce a fost frumos continuă să trăiască în ecoul clipei.",
  "Nostalgia e dovada că ai trăit ceva care a contat.",
  "Fiecare amintire e o poartă deschisă spre o versiune mai veche a ta.",
  "Ce a trecut nu e pierdut — e transformat în înțelepciune.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Game: ANXIOS → Norii Grei (clouds that dissolve on breath tap)
// ─────────────────────────────────────────────────────────────────────────────
function NoriiGrei({ onDone }) {
  const [breathPhase, setBreathPhase] = useState('pause'); // 'inhale' | 'exhale' | 'pause'
  const [breathSec, setBreathSec] = useState(4);
  const [clouds, setClouds] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({ id: i, opacity: 0.85, dissolved: false }))
  );
  const [active, setActive] = useState(false);
  const phaseRef = useRef('pause');

  useEffect(() => {
    if (!active) return;
    let sec = 0;
    const iv = setInterval(() => {
      sec = (sec % 8) + 1;
      if (sec <= 4) { phaseRef.current = 'exhale'; setBreathPhase('inhale'); setBreathSec(4 - sec + 1); }
      else { phaseRef.current = 'inhale'; setBreathPhase('exhale'); setBreathSec(8 - sec + 1); }
    }, 1000);
    return () => clearInterval(iv);
  }, [active]);

  const handleTap = () => {
    if (!active) { setActive(true); return; }
    // Only dissolve if user taps during "exhale" phase (correct rhythm)
    if (phaseRef.current === 'inhale') {
      setClouds(prev => {
        const idx = prev.findIndex(c => !c.dissolved);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], dissolved: true };
        return next;
      });
    }
  };

  const cleared = clouds.filter(c => c.dissolved).length;
  const done = cleared === clouds.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
        Apasă pe ecran doar în momentul expirului (când cercul se contractă). Fiecare atingere în ritm dizolvă un nor.
      </p>

      {/* Sky with clouds */}
      <div onClick={handleTap} style={{
        width: '100%', height: '200px', borderRadius: 'var(--radius-lg)',
        background: done
          ? 'linear-gradient(180deg, #0a1a2e 0%, #1a3a5c 100%)'
          : 'linear-gradient(180deg, #121212 0%, #1a1a2e 100%)',
        position: 'relative', cursor: 'pointer', overflow: 'hidden',
        transition: 'background 1.5s ease', userSelect: 'none'
      }}>
        {/* stars (visible when cloulds gone) */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 71 + 13) % 95}%`, top: `${(i * 37 + 7) % 80}%`,
            width: '3px', height: '3px', borderRadius: '50%',
            background: 'white', opacity: done ? 0.9 : 0.15,
            transition: `opacity ${1 + i * 0.1}s ease`
          }} />
        ))}

        {/* Clouds as emoji rows */}
        {clouds.map((c, i) => (
          <div key={c.id} style={{
            position: 'absolute',
            left: `${(i * 13 + 5) % 75}%`,
            top: `${20 + (i % 3) * 25}%`,
            fontSize: '2.2rem',
            opacity: c.dissolved ? 0 : c.opacity,
            transform: c.dissolved ? 'scale(0) translateY(-20px)' : 'scale(1)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'grayscale(80%)',
            userSelect: 'none'
          }}>☁️</div>
        ))}

        {!active && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-lg)'
          }}>
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600' }}>Atinge pentru a începe</span>
          </div>
        )}

        {done && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '2rem' }}>✨</span>
            <span style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginTop: '0.5rem' }}>Cerul s-a senin!</span>
          </div>
        )}
      </div>

      {/* Breathing guide */}
      {active && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 0.5rem',
            background: 'linear-gradient(135deg, var(--accent-primary), rgba(124,155,181,0.4))',
            animation: breathPhase === 'inhale' ? 'breatheAnimation 4s linear forwards' : 'none',
            transition: 'transform 0.5s ease',
            transform: breathPhase === 'inhale' ? 'scale(1.3)' : 'scale(0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: '600', color: 'var(--bg-primary)'
          }}>
            {breathPhase === 'inhale' ? 'Inspiră' : 'Expiră'}<br />{breathSec}s
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Nori dizolvați: {cleared}/{clouds.length}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game: AGITAT → Furtuna de Idei (bubble pop, slowing down)
// ─────────────────────────────────────────────────────────────────────────────
function FurtunaDeidei({ onDone }) {
  const [bubbles, setBubbles] = useState([]);
  const [popped, setPopped] = useState(0);
  const [elapsed, setElapsed] = useState(0); // 0 → 90 seconds
  const [started, setStarted] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
      if (elapsedRef.current >= 90) { clearInterval(timer); onDone && onDone(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [started]);

  // Spawn bubbles, rate decreases over time  
  useEffect(() => {
    if (!started) return;
    const rate = Math.max(400, 2000 - (elapsedRef.current / 90) * 1600);
    const spawner = setTimeout(() => {
      const id = Date.now() + Math.random();
      setBubbles(prev => [...prev, {
        id, x: 5 + Math.random() * 85, y: 5 + Math.random() * 80,
        size: 30 + Math.random() * 40, color: ['#7C9BB5', '#8FAE9B', '#C4726A', '#9B8FAE'][Math.floor(Math.random() * 4)]
      }]);
    }, rate);
    return () => clearTimeout(spawner);
  }, [started, bubbles]);

  const popBubble = (id) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setPopped(p => p + 1);
  };

  const progress = Math.min(elapsed / 90, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
        Apasă bulele pentru a le descărca. Vei observa că ritmul scade treptat — lasă-te purtat.
      </p>

      {/* Progress bar */}
      {started && (
        <div style={{ width: '100%', background: 'var(--bg-tertiary)', borderRadius: '50px', height: '6px' }}>
          <div style={{
            height: '6px', borderRadius: '50px',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            transition: 'width 1s linear'
          }} />
        </div>
      )}

      {/* Bubble field */}
      <div
        onClick={!started ? () => setStarted(true) : undefined}
        style={{
          width: '100%', height: '260px', background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(124,155,181,0.1)', cursor: started ? 'default' : 'pointer'
        }}
      >
        {!started && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Atinge pentru a începe</span>
          </div>
        )}

        {bubbles.map(b => (
          <button
            key={b.id}
            onClick={() => popBubble(b.id)}
            style={{
              position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
              width: `${b.size}px`, height: `${b.size}px`, borderRadius: '50%',
              background: `${b.color}33`, border: `2px solid ${b.color}88`,
              cursor: 'pointer', animation: 'floatUp 0.3s ease-out',
              transition: 'transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: Math.max(12, b.size * 0.35), color: b.color }}>●</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        {started ? `Bule descărcat: ${popped} · ${Math.max(0, 90 - elapsed)}s rămase` : ''}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game: TRIST → Grădina de Hârtie (plant and water seeds)
// ─────────────────────────────────────────────────────────────────────────────
const SEED_STAGES = ['🌱', '🪴', '🌿', '🌺', '🌸'];

function GradinaDehartie({ onDone, user }) {
  const STORAGE_KEY = `pickl_garden_${user?.uid || 'guest'}`;
  const [plants, setPlants] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [watering, setWatering] = useState(null);

  const savePlants = (newPlants) => {
    setPlants(newPlants);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlants));
  };

  const plantSeed = () => {
    if (plants.length >= 6) return;
    savePlants([...plants, { id: Date.now(), stage: 0, name: `Sеmință ${plants.length + 1}` }]);
  };

  const waterPlant = (id) => {
    setWatering(id);
    setTimeout(() => {
      savePlants(plants.map(p => p.id === id && p.stage < SEED_STAGES.length - 1
        ? { ...p, stage: p.stage + 1 } : p
      ));
      setWatering(null);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
        Plantează semințe și udă-le blând. Grădina ta rămâne salvată — poți reveni oricând.
      </p>

      {/* Garden grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem',
        background: 'var(--bg-primary)', padding: '1.2rem', borderRadius: 'var(--radius-lg)',
        minHeight: '160px'
      }}>
        {plants.map(p => (
          <button
            key={p.id}
            onClick={() => waterPlant(p.id)}
            style={{
              background: watering === p.id ? 'rgba(124,155,181,0.15)' : 'var(--bg-tertiary)',
              border: '1px solid rgba(124,155,181,0.1)', borderRadius: 'var(--radius-md)',
              padding: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.3rem', transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '2rem', transition: 'transform 0.3s ease', transform: watering === p.id ? 'scale(1.2)' : 'scale(1)' }}>
              {SEED_STAGES[p.stage]}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              {p.stage < SEED_STAGES.length - 1 ? 'Atinge pentru a uda 💧' : '🌸 Înflorită!'}
            </span>
          </button>
        ))}

        {plants.length < 6 && (
          <button
            onClick={plantSeed}
            style={{
              background: 'none', border: '1px dashed rgba(124,155,181,0.2)',
              borderRadius: 'var(--radius-md)', padding: '1rem', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >+</button>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        {plants.length === 0 ? 'Apasă + pentru a planta prima sеmință 🌱' :
         `Grădina ta are ${plants.length} plant${plants.length === 1 ? 'ă' : 'e'}. Revii oricând să le îngrijești.`}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game: NOSTALGIC → Cutia cu Amintiri (card memory, no timer)
// ─────────────────────────────────────────────────────────────────────────────
const MEMORY_EMOJIS = ['🌙', '⭐', '🕯️', '🧊', '🌊', '🍂', '🌸', '🦋'];

function CutiaAmintiri({ onDone }) {
  const [cards, setCards] = useState(() => {
    const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    return pairs;
  });
  const [flipped, setFlipped] = useState([]);
  const [quote, setQuote] = useState('');
  const [checking, setChecking] = useState(false);

  const flipCard = (id) => {
    if (checking) return;
    const card = cards.find(c => c.id === id);
    if (card.flipped || card.matched || flipped.length >= 2) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setChecking(true);
      const [a, b] = newFlipped.map(fid => newCards.find(c => c.id === fid));
      setTimeout(() => {
        if (a.emoji === b.emoji) {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
          setQuote(NOSTALGIC_QUOTES[Math.floor(Math.random() * NOSTALGIC_QUOTES.length)]);
        } else {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
        }
        setFlipped([]);
        setChecking(false);
      }, 900);
    }
  };

  const allMatched = cards.every(c => c.matched);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px', margin: '0 auto' }}>
        Potrivește perechi — fără cronometru, fără presiune. Fiecare pereche dezvăluie un gând cald.
      </p>

      {quote && (
        <div style={{
          background: 'rgba(124,155,181,0.08)', border: '1px solid rgba(124,155,181,0.15)',
          padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center',
          fontSize: '0.85rem', fontStyle: 'italic', animation: 'fadeIn 0.4s ease-out'
        }}>
          ✨ "{quote}"
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flipCard(card.id)}
            style={{
              height: '64px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              border: '1px solid rgba(124,155,181,0.15)',
              background: card.matched ? 'rgba(143,174,155,0.15)' : card.flipped ? 'rgba(124,155,181,0.15)' : 'var(--bg-tertiary)',
              fontSize: '1.6rem', transition: 'all 0.3s ease',
              transform: card.flipped || card.matched ? 'rotateY(0deg)' : 'rotateY(180deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {card.flipped || card.matched ? card.emoji : '❓'}
          </button>
        ))}
      </div>

      {allMatched && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
          <p style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>
            ✨ Toate amintirile s-au regăsit.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game: CALM → Constelații (connect stars freely)
// ─────────────────────────────────────────────────────────────────────────────
function Constelatii({ onDone }) {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const linesRef = useRef([]);
  const selectedRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = 280;

    // Generate random stars
    starsRef.current = Array.from({ length: 20 }, () => ({
      x: 15 + Math.random() * (W - 30),
      y: 15 + Math.random() * (H - 30),
      r: 2 + Math.random() * 2,
      glow: Math.random()
    }));

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, W, H);

      // Draw lines
      ctx.strokeStyle = 'rgba(124,155,181,0.4)';
      ctx.lineWidth = 1;
      linesRef.current.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(starsRef.current[a].x, starsRef.current[a].y);
        ctx.lineTo(starsRef.current[b].x, starsRef.current[b].y);
        ctx.stroke();
      });

      // Draw stars
      starsRef.current.forEach((s, i) => {
        const pulse = 0.7 + 0.3 * Math.sin(t / 1000 + s.glow * 10);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = selectedRef.current === i ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.9)';
        ctx.fill();
        // Glow
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        grad.addColorStop(0, 'rgba(124,155,181,0.3)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const my = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

      const hit = starsRef.current.findIndex(s => Math.hypot(s.x - mx, s.y - my) < 16);
      if (hit === -1) { selectedRef.current = null; return; }

      if (selectedRef.current === null) {
        selectedRef.current = hit;
      } else if (selectedRef.current !== hit) {
        const a = selectedRef.current, b = hit;
        const exists = linesRef.current.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
        if (!exists) linesRef.current = [...linesRef.current, [a, b]];
        selectedRef.current = null;
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchend', handleClick);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchend', handleClick);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px', margin: '0 auto' }}>
        Apasă două stele pe rând pentru a le uni. Nu există formă corectă sau greșită — e spațiul tău.
      </p>
      <canvas ref={canvasRef} style={{ width: '100%', height: '280px', borderRadius: 'var(--radius-lg)', display: 'block' }} />
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        {linesRef.current?.length > 0 ? `${linesRef.current?.length || 0} conexiuni desenate` : 'Click pe o stea pentru a selecta, apoi pe alta pentru a conecta'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game: SINGUR → Felinarele Plutitoare
// ─────────────────────────────────────────────────────────────────────────────
function FelinarelePlutioare({ onDone, ws, onlineCount }) {
  const [lanterns, setLanterns] = useState([]);
  const [launched, setLaunched] = useState(false);
  const [myLanternId] = useState(() => Math.random().toString(36).substr(2, 6));

  // Add online-count simulated ambient lanterns
  useEffect(() => {
    // Simulate other lanterns based on online count
    const ambient = Array.from({ length: Math.max(0, (onlineCount || 1) - 1) }, (_, i) => ({
      id: `ambient-${i}`, x: 10 + Math.random() * 80, y: 10 + Math.random() * 60,
      color: ['#C4726A', '#7C9BB5', '#8FAE9B', '#9B8FAE'][i % 4], mine: false
    }));
    setLanterns(ambient);
  }, [onlineCount]);

  const launchLantern = () => {
    if (launched) return;
    setLaunched(true);
    const mine = { id: myLanternId, x: 45 + Math.random() * 10, y: 70, color: '#f0c060', mine: true };
    setLanterns(prev => [...prev, mine]);

    // Animate upward
    setTimeout(() => {
      setLanterns(prev => prev.map(l => l.id === myLanternId ? { ...l, y: 20 + Math.random() * 30 } : l));
    }, 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '340px' }}>
        Lansează un felinar pe cer. El se alătură felinarelor altor oameni treji în această noapte — fiecare luminiță e o prezență reală.
      </p>

      {/* Sky */}
      <div style={{
        width: '100%', height: '240px', background: 'linear-gradient(180deg, #05090f 0%, #0a1520 100%)',
        borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(124,155,181,0.08)'
      }}>
        {/* Stars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            left: `${(i * 53 + 7) % 96}%`, top: `${(i * 37 + 11) % 60}%`,
            width: '2px', height: '2px', background: 'white', opacity: 0.5
          }} />
        ))}

        {/* Lanterns */}
        {lanterns.map(l => (
          <div key={l.id} style={{
            position: 'absolute', left: `${l.x}%`, top: `${l.y}%`,
            transition: 'top 3s cubic-bezier(0.25, 0, 0.5, 1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{
              fontSize: '1.6rem', filter: `drop-shadow(0 0 ${l.mine ? '8px' : '4px'} ${l.color})`,
              animation: 'idleNod 3s ease-in-out infinite alternate'
            }}>🏮</div>
            {l.mine && (
              <span style={{ fontSize: '0.6rem', color: l.color, marginTop: '2px', fontWeight: '600' }}>al tău</span>
            )}
          </div>
        ))}

        {!launched && (
          <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }}>
            <button
              onClick={launchLantern}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.4rem' }}
            >
              🏮 Lansează felinarul tău
            </button>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        {onlineCount > 1
          ? `${onlineCount} oameni sunt treji în această noapte. Nu ești singur/ă.`
          : 'Felinarul tău luminează undeva pe cer.'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game: OBOSIT → Numărătoarea de Oi (minimal, auto-play)
// ─────────────────────────────────────────────────────────────────────────────
function NumaratordeOi({ onDone }) {
  const [count, setCount] = useState(0);
  const [sheepX, setSheepX] = useState(-10);
  const [jumped, setJumped] = useState(false);
  const [sheepY, setSheepY] = useState(0);
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t++;
      setElapsed(t);
      // Animate sheep across then jump
      setSheepX(x => {
        const next = x + 1.5;
        if (next >= 115) {
          // sheep jumped!
          countRef.current += 1;
          setCount(countRef.current);
          setJumped(true);
          setTimeout(() => setJumped(false), 500);
          return -10; // reset to left
        }
        return next;
      });

      if (t >= 60) {
        clearInterval(interval);
        // Auto offer sleep mode after 1 minute
        onDone && onDone();
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const sheepJumpOffset = jumped ? -30 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '340px' }}>
        Poți doar privi — oile sar singure. Lasă mintea să se liniștească.
      </p>

      {/* Sheep scene */}
      <div style={{
        width: '100%', height: '160px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #05090f 0%, #0e1e10 60%, #1a2a1a 100%)',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Moon */}
        <div style={{ position: 'absolute', top: '12px', right: '20px', fontSize: '1.5rem', opacity: 0.9 }}>🌙</div>

        {/* Fence */}
        <div style={{
          position: 'absolute', bottom: '30px', left: 0, right: 0, height: '4px',
          background: 'rgba(143,174,155,0.3)'
        }} />
        {/* Fence posts */}
        {[15, 35, 55, 75].map(pos => (
          <div key={pos} style={{
            position: 'absolute', bottom: '30px', left: `${pos}%`, width: '3px', height: '18px',
            background: 'rgba(143,174,155,0.25)'
          }} />
        ))}

        {/* Sheep */}
        <div style={{
          position: 'absolute',
          left: `${sheepX}%`,
          bottom: `${30 + Math.max(0, -sheepJumpOffset)}px`,
          transform: `translateY(${sheepJumpOffset}px)`,
          transition: 'transform 0.15s ease-out',
          fontSize: '2rem'
        }}>🐑</div>

        {/* Count label */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '0.8rem', color: 'rgba(143,174,155,0.7)' }}>
          {count} oi
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Respiră rar. Ochii pot fi închiși — sunetul ambianței te poate ajuta să adormi.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MiniGame dispatcher
// ─────────────────────────────────────────────────────────────────────────────
const GAME_CONFIG = {
  Anxios:    { title: 'Norii Grei',           emoji: '🌥️', desc: 'Respiră și dizolvă norii întunecați' },
  Agitat:    { title: 'Furtuna de Idei',      emoji: '💭', desc: 'Descarcă energia — bulele se liniștesc singure' },
  Trist:     { title: 'Grădina de Hârtie',   emoji: '🌱', desc: 'Plantează și îngrijește cu blândețe' },
  Nostalgic: { title: 'Cutia cu Amintiri',   emoji: '🧊', desc: 'Potrivește perechi, fără grabă' },
  Calm:      { title: 'Constelații',          emoji: '✨', desc: 'Unește stelele în orice formă dorești' },
  Singur:    { title: 'Felinarele Plutitoare', emoji: '🏮', desc: 'Lansează un felinar alături de ceilalți' },
  Obosit:    { title: 'Numărătoarea de Oi',  emoji: '🐑', desc: 'Privește — oile sar singure' },
};

export default function MiniGame({ mood, onExit, user, ws, onlineCount }) {
  const [done, setDone] = useState(false);
  const cfg = GAME_CONFIG[mood] || GAME_CONFIG['Calm'];

  const renderGame = () => {
    switch (mood) {
      case 'Anxios':    return <NoriiGrei onDone={() => setDone(true)} />;
      case 'Agitat':    return <FurtunaDeidei onDone={() => setDone(true)} />;
      case 'Trist':     return <GradinaDehartie onDone={() => setDone(true)} user={user} />;
      case 'Nostalgic': return <CutiaAmintiri onDone={() => setDone(true)} />;
      case 'Calm':      return <Constelatii onDone={() => setDone(true)} />;
      case 'Singur':    return <FelinarelePlutioare onDone={() => setDone(true)} ws={ws} onlineCount={onlineCount} />;
      case 'Obosit':    return <NumaratordeOi onDone={() => setDone(true)} />;
      default:          return <Constelatii onDone={() => setDone(true)} />;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{cfg.emoji} {cfg.title}</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{cfg.desc}</p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', flexShrink: 0 }}
          onClick={onExit}
        >
          Sari peste →
        </button>
      </div>

      {/* Game area */}
      <div className="view-card" style={{ padding: '1.5rem' }}>
        {renderGame()}
      </div>

      {/* Finish button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '1.2rem', padding: '0.9rem' }}
        onClick={onExit}
      >
        Am terminat ✓
      </button>
    </div>
  );
}
