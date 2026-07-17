import React, { useState, useEffect } from 'react';

const CATEGORIES = ['General', 'Matematică', 'Informatică', 'Medicină', 'Fizică/Chimie', 'Limbi Străine', 'Altele'];

export default function Buddy4Study({ navigateTo, user }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  
  // File upload state (Base64)
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  const fetchStudyPosts = () => {
    fetch('/api/study')
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(err => console.error("Error fetching study posts:", err));
  };

  useEffect(() => {
    fetchStudyPosts();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Safety checks: limit to small files (under 2MB) for json base64 db storage
    if (file.size > 2 * 1024 * 1024) {
      alert("Te rugăm să alegi un document mai mic de 2MB pentru această demonstrație locală.");
      e.target.value = "";
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target.result); // Base64 encoding URI
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setSubmitting(true);
    fetch('/api/study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        description,
        fileName,
        fileData,
        alias: user.alias
      })
    })
      .then(res => res.json())
      .then(() => {
        setTitle('');
        setDescription('');
        setFileName('');
        setFileData(null);
        // Reset file dialog element
        const fileEl = document.getElementById('study-file-input');
        if (fileEl) fileEl.value = "";
        fetchStudyPosts();
      })
      .catch(err => console.error("Error creating study post:", err))
      .finally(() => setSubmitting(false));
  };

  const handleCommentSubmit = (postId, text) => {
    if (!text.trim() || !user) return;

    fetch(`/api/study/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, alias: user.alias })
    })
      .then(res => res.json())
      .then(() => {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchStudyPosts();
      })
      .catch(err => console.error("Error adding academic comment:", err));
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <button className="btn btn-secondary" onClick={() => navigateTo('home')} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
        ← Înapoi la Meniu
      </button>

      <h2>📚 Buddy4Study - Peer Study Board</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Ai blocaje nocturne la teme sau proiecte? Cere ajutor curs complet anonim. Poți urca PDF-uri, rezumat curs sau notițe mici în rețea.
      </p>

      {/* Post creation form */}
      <div className="view-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Cere / Oferă ajutor la cursuri</h3>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Titlu curs sau problemă (ex: Teorema Bayes rezolvare)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ marginBottom: 0, flex: 2 }}
            />
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ marginBottom: 0, flex: 1, background: 'var(--bg-primary)' }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <textarea
            className="textarea-field"
            placeholder="Descrie problema de studiu sau ce notițe ai dori să împarți..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ resize: 'none', height: '90px' }}
          />

          {/* Attachment file section */}
          <div style={{ marginBottom: '1.2rem', padding: '0.8rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(124, 155, 181, 0.15)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>
              📎 Atașează Notițe / PDF (max 2MB):
            </label>
            <input 
              type="file" 
              id="study-file-input"
              onChange={handleFileChange} 
              accept=".pdf,.txt,.png,.jpg,.jpeg,.zip" 
              style={{ fontSize: '0.8rem' }}
            />
            {fileName && (
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', display: 'block', marginTop: '0.3rem' }}>
                Fișier pregătit pentru încărcare: {fileName}
              </span>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%' }}>
            {submitting ? 'Se încarcă...' : 'Postează cerere de studiu'}
          </button>
        </form>
      </div>

      {/* Posts board list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
            Nicio cerere activă pe panoul de studiu. Toată lumea doarme sau se relaxează.
          </p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="view-card" style={{ margin: 0, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span className="presence-pill" style={{ background: 'rgba(124, 155, 181, 0.15)', color: 'var(--accent-primary)' }}>
                  📖 {post.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(post.timestamp).toLocaleDateString('ro-RO')}
                </span>
              </div>

              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                {post.title}
              </h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                {post.description}
              </p>

              {/* Attachment Download link */}
              {post.fileName && post.fileData && (
                <div style={{ marginBottom: '1.5rem', padding: '0.8rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Attachment: 📋 {post.fileName}
                  </span>
                  <a 
                    href={post.fileData} 
                    download={post.fileName} 
                    className="btn" 
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', background: 'var(--bg-tertiary)' }}
                  >
                    Descarcă
                  </a>
                </div>
              )}

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>
                Postat de: <strong>{post.alias}</strong> (Anonim)
              </div>

              {/* Academic commentary responses */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.8rem', borderRadius: 'var(--radius-md)' }}>
                <h5 style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Răspunsuri academice anonyme:</h5>
                
                {post.comments && post.comments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    {post.comments.map(c => (
                      <div key={c.id} style={{ fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.4rem' }}>
                        <strong style={{ color: 'var(--accent-secondary)' }}>{c.alias}:</strong> {c.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '0.8rem' }}>
                    Niciun răspuns de ajutor pe această temă încă.
                  </p>
                )}

                {/* Submitting comments */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Oferă un răspuns sau pont util..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    style={{ marginBottom: 0, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => handleCommentSubmit(post.id, commentInputs[post.id] || '')}
                    disabled={!(commentInputs[post.id] || '').trim()}
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
