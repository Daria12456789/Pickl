import React, { useState, useEffect, useRef } from 'react';

// mode: null = lobby screen, 'breath' = breathing, 'game' = runner
export default function OfflineGame({ onBackToHome }) {
  const [mode, setMode] = useState(null); // null | 'breath' | 'game'

  // Breathing states
  const [offlineBreathActive, setOfflineBreathActive] = useState(false);
  const [breathText, setBreathText] = useState('Pregătit/ă');
  const [seconds, setSeconds] = useState(4);

  // Runner Game States
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('cucumber_highscore') || '0');
  });

  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  // Breathing timer
  useEffect(() => {
    if (!offlineBreathActive) {
      setBreathText('Pregătit/ă');
      return;
    }
    let count = 0;
    const interval = setInterval(() => {
      count = (count % 8) + 1;
      if (count <= 4) {
        setBreathText('Inspiră... 💨');
        setSeconds(4 - count + 1);
      } else {
        setBreathText('Expiră... 💨');
        setSeconds(8 - count + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [offlineBreathActive]);

  // Canvas game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const w = canvas.width = 480;
    const h = canvas.height = 180;
    let frame = 0;
    let currentScore = 0;

    const cat = { x: 50, y: h - 45, w: 30, h: 30, vy: 0, gravity: 0.6, jumpForce: -9, isGrounded: true };
    let obstacles = [];
    let speed = 4;

    const spawnObstacle = () => {
      const types = ['cucumber', 'puddle'];
      const type = types[Math.floor(Math.random() * types.length)];
      obstacles.push({
        x: w + 20,
        y: type === 'cucumber' ? h - 40 : h - 25,
        w: type === 'cucumber' ? 18 : 28,
        h: type === 'cucumber' ? 24 : 10,
        type,
        emoji: type === 'cucumber' ? '🥒' : '💧'
      });
    };

    const handleJump = () => { if (cat.isGrounded) { cat.vy = cat.jumpForce; cat.isGrounded = false; } };
    const handleCanvasClick = (e) => { e.preventDefault(); handleJump(); };
    const handleKeyDown = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleJump(); } };

    canvas.addEventListener('mousedown', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick);
    window.addEventListener('keydown', handleKeyDown);

    const update = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#080d14'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 5; i++) ctx.fillRect((i * 100 + frame * 0.1) % w, 20 + (i * 12) % 60, 2, 2);

      ctx.fillStyle = '#1a2a3a'; ctx.fillRect(0, h - 20, w, 20);
      ctx.fillStyle = 'rgba(124,155,181,0.15)'; ctx.fillRect(0, h - 20, w, 1);

      cat.vy += cat.gravity; cat.y += cat.vy;
      if (cat.y >= h - 45) { cat.y = h - 45; cat.vy = 0; cat.isGrounded = true; }

      ctx.font = '28px sans-serif';
      ctx.fillText('🐱', cat.x, cat.y + 24);

      if (frame % 100 === 0) spawnObstacle();
      if (frame % 300 === 0) speed += 0.5;

      obstacles = obstacles.filter(obs => {
        obs.x -= speed;
        ctx.font = obs.type === 'cucumber' ? '22px sans-serif' : '26px sans-serif';
        ctx.fillText(obs.emoji, obs.x, obs.y + (obs.type === 'cucumber' ? 18 : 10));
        const colX = cat.x < obs.x + obs.w && cat.x + cat.w > obs.x;
        const colY = cat.y < obs.y + obs.h && cat.y + cat.h > obs.y;
        if (colX && colY) { setGameOver(true); return false; }
        if (obs.x + obs.w < cat.x && !obs.scored) { obs.scored = true; currentScore += 10; setScore(currentScore); }
        return obs.x > -50;
      });

      if (!gameOver) gameLoopRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      canvas.removeEventListener('mousedown', handleCanvasClick);
      canvas.removeEventListener('touchstart', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (score > highScore) { setHighScore(score); localStorage.setItem('cucumber_highscore', String(score)); }
  }, [score, highScore]);

  const startGame = () => { setGameOver(false); setScore(0); setGameStarted(true); };

  const goBack = () => {
    setMode(null);
    setOfflineBreathActive(false);
    setGameStarted(false);
    setGameOver(false);
  };

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out', padding: '1rem' }}>

      {/* Offline banner — always visible */}
      <div style={{
        background: 'rgba(196,114,106,0.12)', border: '1px solid var(--color-alert)',
        color: '#DCA19A', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <strong>🔌 Mod Deconectat (Offline)</strong>
          <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.85 }}>
            Conexiunea s-a pierdut. Funcțiile de mai jos rulează 100% local.
          </p>
        </div>
        <button className="btn" style={{ fontSize: '0.72rem', padding: '0.35rem 0.7rem' }} onClick={onBackToHome}>
          Reîncearcă Net
        </button>
      </div>

      {/* ── LOBBY: alege ce vrei să faci ── */}
      {mode === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '3rem' }}>🐱</span>
            <h2 style={{ margin: '0.5rem 0 0.3rem 0' }}>Ce vrei să faci acum?</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Alege o activitate relaxantă fără a fi nevoie de internet.
            </p>
          </div>

          {/* Buton Respirație */}
          <button
            onClick={() => setMode('breath')}
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--accent-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 1.5rem',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
              transition: 'all 0.2s ease',
              color: 'var(--color-text)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,155,181,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          >
            <span style={{ fontSize: '3.5rem' }}>🧘</span>
            <strong style={{ fontSize: '1.3rem' }}>Exercițiu de Respirație</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '280px', textAlign: 'center' }}>
              Ghid de inspirat și expirat în ritm de 4-4 secunde, complet local.
            </span>
          </button>

          {/* Buton Joc */}
          <button
            onClick={() => { setMode('game'); startGame(); }}
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--accent-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 1.5rem',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
              transition: 'all 0.2s ease',
              color: 'var(--color-text)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(143,174,155,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          >
            <span style={{ fontSize: '3.5rem' }}>🐾</span>
            <strong style={{ fontSize: '1.3rem' }}>Jocul Pisicii — Cucumber Runner</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '280px', textAlign: 'center' }}>
              Ajută pisica să sară peste 🥒 castraveți și să evite 💧 bălțile de apă.
            </span>
          </button>
        </div>
      )}

      {/* ── RESPIRAȚIE ── */}
      {mode === 'breath' && (
        <div className="view-card" style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
          <button className="btn btn-secondary" onClick={goBack} style={{ marginBottom: '1rem', paddingLeft: 0, alignSelf: 'flex-start' }}>
            ← Înapoi
          </button>
          <h3>🧘 Exercițiu de Respirație Local</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: '0.5rem 0 1.5rem 0' }}>
            Apasă cercul sau butonul de mai jos pentru a porni/opri exercițiul.
          </p>

          <div
            className={`breathing-pulsar ${offlineBreathActive ? 'active' : ''}`}
            onClick={() => setOfflineBreathActive(prev => !prev)}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{breathText}</div>
              {offlineBreathActive && <div style={{ fontSize: '1rem', marginTop: '0.2rem' }}>{seconds}s</div>}
            </div>
          </div>

          <button
            className={`btn ${offlineBreathActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setOfflineBreathActive(prev => !prev)}
            style={{ marginTop: '1.2rem' }}
          >
            {offlineBreathActive ? '⏸ Oprește Respirația' : '▶ Începe Sincronizarea'}
          </button>
        </div>
      )}

      {/* ── JOC ── */}
      {mode === 'game' && (
        <div className="view-card" style={{ textAlign: 'center', padding: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button className="btn btn-secondary" onClick={goBack} style={{ paddingLeft: 0 }}>← Înapoi</button>
            <h3 style={{ margin: 0 }}>🥒 Cucumber Runner</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              Best: {highScore}
            </div>
          </div>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Spațiu / Săgeată Sus / Tap pe ecran = săritură 🐱
          </p>

          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', border: '1px solid rgba(124,155,181,0.15)', borderRadius: 'var(--radius-md)', display: 'block', background: '#080d14' }}
            />

            <div style={{ position: 'absolute', top: '10px', left: '15px', color: '#fff', fontSize: '0.85rem', textShadow: '1px 1px 1px #000', pointerEvents: 'none' }}>
              <div>Scor: {score}</div>
            </div>

            {!gameStarted && !gameOver && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,22,32,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
                <button className="btn btn-primary" onClick={startGame}>🐱 Începe Alergarea!</button>
              </div>
            )}

            {gameOver && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,22,32,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', gap: '0.6rem' }}>
                <h4 style={{ color: 'var(--color-alert)', margin: 0, fontSize: '1.3rem' }}>Joc terminat! 😿</h4>
                <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0 }}>Scor: {score} punct{score !== 1 ? 'e' : ''}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={startGame}>Reîncearcă</button>
                  <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={goBack}>Înapoi la Meniu</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
