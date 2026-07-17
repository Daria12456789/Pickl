import React, { useState, useEffect, useRef } from 'react';

export default function SleepwaveSymphony({ navigateTo, ws, onlineCount, soundCounts }) {
  const [selectedSound, setSelectedSound] = useState(null); // 'rain', 'waves', 'piano', 'crickets'
  const [volume, setVolume] = useState(0.5);
  const [playing, setPlaying] = useState(false);

  // Web Audio Refs
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const soundNodeRef = useRef(null); // Active synth generator node

  // Notify backend of our selection
  useEffect(() => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'update_sound', sound: playing ? selectedSound : null }));
    }
  }, [selectedSound, playing, ws]);

  // Handle master volume adjustments
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Audio synths builder using Web Audio API
  const startAudioEngine = (soundType) => {
    stopAudioEngine();

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const masterDest = gainNodeRef.current;

    if (soundType === 'rain' || soundType === 'waves') {
      // Noise Synth generator (for rain and waves simulation)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Make pink noise for more pleasant acoustic density
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // normalise
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 1;

      // LFO for wave sweeps, rain is static but waves have slow swells
      if (soundType === 'waves') {
        filter.frequency.value = 350;
        
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.125; // 8 seconds cycle duration

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 250;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        
        // save oscillator reference to shutdown
        soundNodeRef.current = { source: noiseSource, lfo };
      } else {
        // rain filter is steady
        filter.frequency.value = 500;
        soundNodeRef.current = { source: noiseSource };
      }

      noiseSource.connect(filter);
      filter.connect(masterDest);
      noiseSource.start();

    } else if (soundType === 'crickets') {
      // Simulating chirping crickets
      const cricketScript = ctx.createScriptProcessor(4096, 0, 1);
      let phase = 0;

      cricketScript.onaudioprocess = (e) => {
        const out = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < out.length; i++) {
          const sampleTime = (phase + i) / ctx.sampleRate;
          
          // Chirp frequency is ~4.2kHz
          const carrier = Math.sin(2 * Math.PI * 4200 * sampleTime);
          
          // Chirps occur in bursts
          const chirpBurst = Math.sin(2 * Math.PI * 55 * sampleTime) * 0.5 + 0.5;
          const silentPause = Math.sin(2 * Math.PI * 2 * sampleTime) * 0.5 + 0.5;
          
          let envelope = 0;
          if (silentPause > 0.75) {
            envelope = chirpBurst * 0.05;
          }
          
          out[i] = carrier * envelope;
        }
        phase += out.length;
      };

      cricketScript.connect(masterDest);
      soundNodeRef.current = { script: cricketScript };

    } else if (soundType === 'piano') {
      // Generate automatic arpeggios on pentatonic keys
      const baseNoteFrequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5
      let nextNoteTime = ctx.currentTime;
      let noteIndex = 0;

      const schedulePianoNode = () => {
        // Trigger chord notes at random slow steps
        const time = ctx.currentTime;
        if (time >= nextNoteTime) {
          const freq = baseNoteFrequencies[Math.floor(Math.random() * baseNoteFrequencies.length)];
          const osc = ctx.createOscillator();
          const amp = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          amp.gain.setValueAtTime(0, time);
          amp.gain.linearRampToValueAtTime(0.08, time + 0.05); // soft attach
          amp.gain.exponentialRampToValueAtTime(0.0001, time + 3.5); // long decay decay

          osc.connect(amp);
          amp.connect(masterDest);
          osc.start(time);
          osc.stop(time + 4.0);

          nextNoteTime = time + 2.5 + Math.random() * 3.0; // delay between notes
        }
      };

      // Poll triggers
      const intervalId = setInterval(schedulePianoNode, 200);

      soundNodeRef.current = { timer: intervalId };
    }
  };

  const stopAudioEngine = () => {
    if (soundNodeRef.current) {
      if (soundNodeRef.current.source) {
        try { soundNodeRef.current.source.stop(); } catch {}
      }
      if (soundNodeRef.current.lfo) {
        try { soundNodeRef.current.lfo.stop(); } catch {}
      }
      if (soundNodeRef.current.script) {
        soundNodeRef.current.script.disconnect();
      }
      if (soundNodeRef.current.timer) {
        clearInterval(soundNodeRef.current.timer);
      }
      soundNodeRef.current = null;
    }
  };

  const toggleSound = (soundType) => {
    if (selectedSound === soundType && playing) {
      // Toggle off
      setPlaying(false);
      stopAudioEngine();
    } else {
      setSelectedSound(soundType);
      setPlaying(true);
      startAudioEngine(soundType);
    }
  };

  // Play a manual piano note for interactive light mapping
  const playInteractiveScale = (noteIndex) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const noteFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const freq = noteFreqs[noteIndex % noteFreqs.length];

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    amp.gain.setValueAtTime(0, ctx.currentTime);
    amp.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

    osc.connect(amp);
    amp.connect(gainNodeRef.current || ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  };

  useEffect(() => {
    return () => {
      stopAudioEngine();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>🎵 The Sleepwave Symphony</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Mixerul ambiental al nopții. Selectează un canal pentru a-ți compune propriul fundal sonor relaxant. Punctele luminoase reprezintă alți oameni treji; atinge-le ca să creezi un acord colectiv.
      </p>

      {/* sound buttons dashboard */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Alege un sunet generator:</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'rain', name: '🌧️ Ploaie caldă', countId: 'rain' },
            { id: 'waves', name: '🌊 Valuri oceanice', countId: 'waves' },
            { id: 'piano', name: '🎹 Acorduri pian', countId: 'piano' },
            { id: 'crickets', name: '🦗 Cânt de greieri', countId: 'crickets' }
          ].map(s => {
            const isCurrent = selectedSound === s.id && playing;
            const currentSoundVotes = soundCounts[s.countId] || 0;
            return (
              <button
                key={s.id}
                onClick={() => toggleSound(s.id)}
                className="btn"
                style={{
                  height: '70px',
                  background: isCurrent ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: isCurrent ? 'var(--bg-primary)' : 'var(--color-text)',
                  borderColor: isCurrent ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
              >
                <strong>{s.name}</strong>
                <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                  {currentSoundVotes} oameni ascultă
                </span>
              </button>
            );
          })}
        </div>

        {/* Master Volume control */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>Master Volume</span>
            <span>{Math.round(volume * 100)}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent-primary)' }}
          />
        </div>
      </div>

      {/* Interactive Light Map (Silent nodes) */}
      <div className="view-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Harta Licuricilor</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: '1.2rem' }}>
          Fiecare punct luminează o conexiune. Apasă pe noduri ca să creezi note de pian armonioase în rețea.
        </p>

        <div style={{
          height: '180px', width: '100%', background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)', position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(124, 155, 181, 0.1)'
        }}>
          {Array.from({ length: Math.max(onlineCount, 1) }).map((_, idx) => {
            // Semi-random coordinates based on index so nodes don't move and jump erratically
            const left = Math.round(15 + (Math.sin(idx + 1) * 35 + 50)) % 90;
            const top = Math.round(15 + (Math.cos(idx * 2) * 35 + 50)) % 80;
            return (
              <div
                key={idx}
                onClick={() => playInteractiveScale(idx)}
                style={{
                  position: 'absolute', left: `${left}%`, top: `${top}%`,
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: 'radial-gradient(circle, #fff 20%, var(--accent-primary) 80%)',
                  boxShadow: '0 0 12px 4px var(--accent-primary)', cursor: 'pointer',
                  animation: `pulseFirefly ${2 + (idx % 3)}s infinite alternate`,
                  padding: '4px'
                }}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulseFirefly {
          0% { transform: scale(0.85); opacity: 0.5; box-shadow: 0 0 8px 2px var(--accent-primary); }
          100% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 16px 6px var(--accent-primary); }
        }
      `}</style>
    </div>
  );
}
