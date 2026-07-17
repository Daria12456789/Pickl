import React, { useState, useEffect } from 'react';

export default function SocialFeed({ navigateTo, user }) {
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({}); // postId -> commentInput
  
  const fetchFeed = () => {
    fetch('/api/feed')
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(err => console.error("Error fetching feed:", err));
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim() || !user) return;

    setSubmitting(true);
    fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: postText, alias: user.alias })
    })
      .then(res => res.json())
      .then(() => {
        setPostText('');
        fetchFeed();
      })
      .catch(err => console.error("Error creating post:", err))
      .finally(() => setSubmitting(false));
  };

  const handleReact = (postId, reactionType) => {
    fetch(`/api/feed/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: reactionType })
    })
      .then(res => res.json())
      .then(() => {
        fetchFeed();
      })
      .catch(err => console.error("Error reacting to post:", err));
  };

  const handleCommentSubmit = (postId, commentText) => {
    if (!commentText.trim() || !user) return;
    
    fetch(`/api/feed/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText, alias: user.alias })
    })
      .then(res => res.json())
      .then(() => {
        setExpandedComments(prev => ({ ...prev, [postId]: '' })); // Clear comment text
        fetchFeed();
      })
      .catch(err => console.error("Error commenting on post:", err));
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>📣 Ecoul Zidului - Social Feed</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Scrie gândurile tale nocturne pe perete complet anonim. Reacționează discret sau comentează pentru a arăta altora că nu sunt singuri.
      </p>

      {/* Post creator */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handlePostSubmit}>
          <textarea
            className="textarea-field"
            placeholder="Ce este în gândul tău la ora asta? Lasă un ecou pe perete..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            maxLength={280}
            style={{ resize: 'none', height: '90px', marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Te identifici ca: <strong>{user?.alias}</strong> (Alias Rotativ)
            </span>
            <button type="submit" disabled={submitting || !postText.trim()} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
              Trimite gând
            </button>
          </div>
        </form>
      </div>

      {/* Feed list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
            Liniște totală pe zid în această seară... Fii tu primul care face un zgomot mic.
          </p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="view-card" style={{ margin: 0, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                <strong>✍️ {post.alias}</strong>
                <span>{new Date(post.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <p style={{ fontSize: '0.98rem', lineHeeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                {post.text}
              </p>

              {/* Reaction Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '0.6rem 0', marginBottom: '0.8rem' }}>
                <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleReact(post.id, 'support')}>
                  🤗 Te-am citit ({post.reactions.support || 0})
                </button>
                <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleReact(post.id, 'listened')}>
                  👂 Te ascult ({post.reactions.listened || 0})
                </button>
                <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleReact(post.id, 'hug')}>
                  🤍 Îmbrățișare ({post.reactions.hug || 0})
                </button>
              </div>

              {/* Comments Section */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.8rem', borderRadius: 'var(--radius-md)' }}>
                {post.comments && post.comments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.8rem' }}>
                    {post.comments.map(c => (
                      <div key={c.id} style={{ fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{c.alias}:</span>{' '}
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Form */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Adaugă un comentariu cald..."
                    value={expandedComments[post.id] || ''}
                    onChange={(e) => setExpandedComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                    style={{ marginBottom: 0, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  />
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => handleCommentSubmit(post.id, expandedComments[post.id] || '')}
                    disabled={!(expandedComments[post.id] || '').trim()}
                  >
                    Răspunde
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
