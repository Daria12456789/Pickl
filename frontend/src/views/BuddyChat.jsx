import React, { useState, useEffect, useRef } from 'react';

export default function BuddyChat({ navigateTo, user, ws, peerMessageListener }) {
  const [activeTab, setActiveTab] = useState('lobby'); // 'lobby', 'peer', 'ai'
  
  // Peer states
  const [peerStatus, setPeerStatus] = useState('idle'); // 'idle', 'matching', 'connected'
  const [peerAlias, setPeerAlias] = useState('');
  const [peerMessages, setPeerMessages] = useState([]);
  const [peerInput, setPeerInput] = useState('');

  // AI states
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: 'Bună. Sunt Pickl, prezența ta calmă din această noapte. Cum te simți în clipa asta? Putem sta de vorbă despre orice te apasă.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [peerMessages, aiMessages, peerStatus]);

  // Setup WS listener for Peer matching
  useEffect(() => {
    if (activeTab !== 'peer' || !ws) return;

    peerMessageListener.current = (data) => {
      if (data.type === 'waiting_in_queue') {
        setPeerStatus('matching');
      } else if (data.type === 'match_found') {
        setPeerStatus('connected');
        setPeerAlias(data.peerAlias);
        setPeerMessages([{ sender: 'system', text: `Conectat cu ${data.peerAlias}. Conversația este 100% anonimă și efemeră.` }]);
      } else if (data.type === 'chat_message') {
        setPeerMessages((prev) => [...prev, { sender: 'peer', text: data.text }]);
      } else if (data.type === 'peer_disconnected') {
        setPeerMessages((prev) => [...prev, { sender: 'system', text: 'Partenerul s-a deconectat. Sesiunea s-a încheiat.' }]);
        setPeerStatus('idle');
      }
    };

    return () => {
      peerMessageListener.current = null;
    };
  }, [activeTab, ws]);

  // Peer Actions
  const startPeerMatch = () => {
    if (!ws || ws.readyState !== 1) return;
    setPeerMessages([]);
    setPeerStatus('matching');
    ws.send(JSON.stringify({ type: 'join_queue' }));
  };

  const leavePeerMatch = () => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'leave_chat' }));
    ws.send(JSON.stringify({ type: 'leave_queue' }));
    setPeerStatus('idle');
    setPeerMessages([]);
    setActiveTab('lobby');
  };

  const sendPeerMessage = (e) => {
    e.preventDefault();
    if (!peerInput.trim() || !ws) return;
    ws.send(JSON.stringify({ type: 'send_message', text: peerInput }));
    setPeerMessages((prev) => [...prev, { sender: 'self', text: peerInput }]);
    setPeerInput('');
  };

  // AI Actions
  const sendAiMessage = (e) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userText = aiInput;
    const updatedMessages = [...aiMessages, { role: 'user', content: userText }];
    setAiMessages(updatedMessages);
    setAiInput('');
    setAiLoading(true);

    fetch('/api/ai/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) })
    })
      .then(res => res.json())
      .then(data => {
        if (data.choices && data.choices[0].message) {
          setAiMessages(prev => [...prev, data.choices[0].message]);
        } else {
          setAiMessages(prev => [...prev, { role: 'assistant', content: 'Îmi cer scuze, întâmpin greutăți de comunicare. Sunt totuși aici cu tine.' }]);
        }
      })
      .catch(() => {
        setAiMessages(prev => [...prev, { role: 'assistant', content: 'Purr... Sunt aici, te ascult în continuare. Spune-mi mai multe.' }]);
      })
      .finally(() => setAiLoading(false));
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => { leavePeerMatch(); navigateTo('home'); }} style={{ paddingLeft: 0 }}>
          ← Înapoi la Meniu
        </button>
        <h2>💬 Lobby Conversații</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Vorbește anonim cu un alt utilizator activ din aplicație sau discută rapid cu AI Companion.
        </p>
      </div>

      {activeTab === 'lobby' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          {/* Peer match container */}
          <div className="view-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</span>
            <h3>Buddy Chat 1-la-1 Anonim</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1.5rem 0' }}>
              Te punem în legătură cu un alt participant activ în nopțile albe. Fără istoric salvat. Aliasurile se auto-generează rotativ.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setActiveTab('peer'); startPeerMatch(); }}>
              Caută un Prieten Anonim
            </button>
          </div>

          {/* AI companion container */}
          <div className="view-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤖</span>
            <h3>AI Companion Pickl</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1.5rem 0' }}>
              Un companion digital empatic cu disponibilitate 24/7. Promptat strict pentru a nu oferi recomandări medicale/dozaje clinice.
            </p>
            <button className="btn" style={{ width: '100%' }} onClick={() => setActiveTab('ai')}>
              Discută cu AI Companion
            </button>
          </div>
        </div>
      )}

      {/* Peer Matching View */}
      {activeTab === 'peer' && (
        <div className="view-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👥</span> {peerStatus === 'connected' ? `Convorbire cu ${peerAlias}` : 'Se caută partener...'}
            </h4>
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={leavePeerMatch}>
              Închide Chat
            </button>
          </div>

          {/* Messages screen */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', paddingRight: '4px', minHeight: '260px', maxHeight: '350px' }}>
            {peerStatus === 'matching' && (
              <div style={{ textAlign: 'center', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(124, 155, 181, 0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Căutăm altcineva disponibil in rețea...</p>
                <button className="btn btn-secondary" onClick={() => { leavePeerMatch(); setActiveTab('lobby'); }}>Anulează</button>
              </div>
            )}

            {peerMessages.map((msg, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: msg.sender === 'self' ? 'flex-end' : msg.sender === 'peer' ? 'flex-start' : 'center',
                  background: msg.sender === 'self' ? 'var(--accent-primary)' : msg.sender === 'peer' ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)',
                  color: msg.sender === 'self' ? 'var(--bg-primary)' : 'var(--color-text)',
                  border: msg.sender === 'system' ? '1px dashed rgba(124,155,181,0.2)' : 'none',
                  padding: '0.6rem 1rem', borderRadius: '12px', maxWidth: '80%',
                  fontSize: msg.sender === 'system' ? '0.78rem' : '0.9rem',
                  fontStyle: msg.sender === 'system' ? 'italic' : 'normal',
                  textAlign: msg.sender === 'system' ? 'center' : 'left'
                }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {peerStatus === 'connected' && (
            <form onSubmit={sendPeerMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Scrie un mesaj cald..." 
                value={peerInput}
                onChange={(e) => setPeerInput(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <button type="submit" className="btn btn-primary">Trimite</button>
            </form>
          )}
        </div>
      )}

      {/* AI Companion view */}
      {activeTab === 'ai' && (
        <div className="view-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🤖</span> AI Companion Pickl
            </h4>
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('lobby')}>
              Înapoi la Lobby
            </button>
          </div>

          {/* Messages list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', paddingRight: '4px', minHeight: '260px', maxHeight: '350px' }}>
            {aiMessages.map((msg, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--color-text)',
                  padding: '0.6rem 1rem', borderRadius: '12px', maxWidth: '80%',
                  fontSize: '0.9rem'
                }}
              >
                {msg.content}
              </div>
            ))}
            {aiLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-tertiary)', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', gap: '4px', opacity: 0.7 }}>
                <span className="dot" style={{ animation: 'blink 1.4s infinite decimal', width: '6px', height: '6px', backgroundColor: 'var(--color-text)', borderRadius: '50%' }}></span>
                <span className="dot" style={{ animation: 'blink 1.4s infinite decimal 0.2s', width: '6px', height: '6px', backgroundColor: 'var(--color-text)', borderRadius: '50%' }}></span>
                <span className="dot" style={{ animation: 'blink 1.4s infinite decimal 0.4s', width: '6px', height: '6px', backgroundColor: 'var(--color-text)', borderRadius: '50%' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendAiMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Spune computerului ce te frământă..." 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              style={{ marginBottom: 0 }}
              disabled={aiLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={aiLoading || !aiInput.trim()}>
              Trimite
            </button>
          </form>
        </div>
      )}

      {/* Define inline animations for spinning loaders */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}</style>
    </div>
  );
}
