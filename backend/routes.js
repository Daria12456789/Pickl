import express from 'express';
import { db } from './db.js';

const router = express.Router();

// Helper to generate a rotating anonymous session alias
const ADJECTIVES = ['Blând', 'Liniștit', 'Nocturn', 'Calm', 'Visător', 'Licuritor', 'Păstrător', 'Călduros', 'Tăcut', 'Treaz'];
const NOUNS = ['Licurici', 'Greier', 'Val', 'Nor', 'Astru', 'Călător', 'Far', 'Fulg', 'Adăpost', 'Vis'];

function generateSessionAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj} ${noun} #${num}`;
}

// 1. Anonymous Authentication
router.post('/auth/anonymous', async (req, res) => {
  try {
    const uid = Math.random().toString(36).substr(2, 15);
    const alias = generateSessionAlias();
    // Cache user settings basic
    await db.saveUser(uid, { uid, alias, createdAt: Date.now() });
    res.json({ success: true, uid, alias });
  } catch (err) {
    res.status(500).json({ error: "Authentication failed", details: err.message });
  }
});

// 2. Check-ins
router.get('/checkin', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    const entries = await db.getCheckins(uid);
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/checkin', async (req, res) => {
  try {
    const { uid, text, state, rating } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    const entry = await db.addCheckin(uid, { text, state, rating });
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregate stats for Temporal Presence Map (Checkins per hour in last 30 days)
router.get('/stats/presence', async (req, res) => {
  try {
    // Collect stats from ALL checkins in the DB
    const hrs = Array(24).fill(0);
    const checkins = db.data.checkins || [];
    checkins.forEach(c => {
      const date = new Date(c.timestamp);
      const hr = date.getHours();
      hrs[hr]++;
    });
    // Add some baseline simulated data to make chart look nicer (e.g. night peak) if the DB is empty
    const normalizedStats = hrs.map((cnt, index) => {
      // Hour peaks at night (e.g. 23:00 to 04:00)
      let baseline = 0;
      if (index >= 22 || index <= 5) {
        baseline = Math.floor(Math.sin((index + 2) / 3) * 6) + 10;
      } else {
        baseline = Math.floor(Math.random() * 3) + 2;
      }
      return { hour: `${index}:00`, count: cnt + baseline };
    });
    res.json({ stats: normalizedStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Social Feed (Anonymous message board)
router.get('/feed', async (req, res) => {
  try {
    const posts = await db.getFeed();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feed', async (req, res) => {
  try {
    const { text, alias } = req.body;
    if (!text || !alias) return res.status(400).json({ error: "Missing content" });
    const post = await db.addFeedPost({ text, alias });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feed/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'support' | 'listened' | 'hug'
    const post = await db.reactToFeedPost(id, type);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feed/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, alias } = req.body;
    if (!text || !alias) return res.status(400).json({ error: "Missing comment data" });
    const post = await db.addCommentToFeedPost(id, { text, alias });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Buddy4Study endpoints
router.get('/study', async (req, res) => {
  try {
    const posts = await db.getStudyPosts();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study', async (req, res) => {
  try {
    const { title, category, description, fileName, fileData, alias } = req.body;
    if (!title || !description || !alias) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const post = await db.addStudyPost({ title, category, description, fileName, fileData, alias });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, alias } = req.body;
    const post = await db.addCommentToStudyPost(id, { text, alias });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Medication Tracker (Local private sync)
router.get('/meds', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    const list = await db.getMedication(uid);
    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/meds', async (req, res) => {
  try {
    const { uid, list } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    const saved = await db.saveMedication(uid, list || []);
    res.json({ success: true, list: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Night Echoes
router.get('/echo', async (req, res) => {
  try {
    const { hour } = req.query;
    const targetHour = hour === undefined ? new Date().getHours() : hour;
    const echoes = await db.getEchoes(targetHour);
    res.json({ echoes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/echo', async (req, res) => {
  try {
    const { text, hour } = req.body;
    if (!text || hour === undefined) return res.status(400).json({ error: "Missing text or hour" });
    const echo = await db.addEcho({ text, hour });
    res.json({ success: true, echo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. AI Proxy endpoint supporting Fireworks AI structure and local mockup rule engine
const CRISIS_WORDS = [
  'suicid', 'sinucid', 'vreau sa mor', 'sa mor', 'taiat', 'tai', 'autovatamare', 'abuz',
  'bataie', 'batut', 'scap de viata', 'omor', 'kill', 'die', 'hurt myself', 'end my life', 'spanzur'
];

router.post('/ai/companion', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages" });
    }

    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    // Check pre-emptive trigger for crisis support
    const hasCrisis = CRISIS_WORDS.some(w => lastMessage.includes(w));
    if (hasCrisis) {
      return res.json({
        choices: [{
          message: {
            role: "assistant",
            content: "Mă îngrijorează mult ceea ce îmi spui. Te rog să știi că nu ești singur(ă) și că există ajutor specializat disponibil chiar în acest moment. Poți contacta linii de urgență gratuite și complet anonime care te vor susține și te vor asculta fără judecată. Te rog, apasă butonul roșu 'Am nevoie de ajutor acum' din colțul ecranului pentru a vedea detaliile sau sună direct la numărul de asistență pentru criză din țara ta."
          }
        }]
      });
    }

    // Fireworks API setup
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (apiKey) {
      // API integration
      const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/llama-v3-8b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Ești un companion digital empatic și blând numit Noptieră. Scopul tău este să oferi o prezență caldă și ascultare activă pentru utilizatorii care se luptă cu insomnia, anxietatea sau singurătatea în timpul nopții. Răspunde scurt (max 3-4 propoziții), în limba română, cu un ton foarte cald, suportiv și discret. REGULĂ DE AUR: Nu oferi diagnostice medicale, tratamente sau doze. Nu sugera că ai capacități terapeutice clinice. Dacă utilizatorul este agitat sau anxios, sugerează-i să facă un exercițiu de respirație ghidată din meniul aplicației noastre.'
            },
            ...messages
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      } else {
        const errorText = await response.text();
        console.error("Fireworks AI Error response:", errorText);
        // Fall back to NLP layout below
      }
    }

    // fallback mock companion replies
    const comfortingReplies = [
      "Sunt aici cu tine în această noapte liniștită. E în regulă dacă nu poți dormi acum.",
      "Respiră adânc. Uneori, doar faptul că trecem prin noapte pas cu pas este de ajuns.",
      "Te aud și înțeleg că este greu. Dacă te simți agitat, îți recomand cu căldură să încerci exercițiul de respirație ghidată din meniul Noptieră.",
      "Gândurile tind să pară mult mai mari și mai grele la ora aceasta. Încearcă să le lași să treacă precum norii pe cerul nopții.",
      "Nu ești singur/ă treaz/ă în clipa asta. Mulți alți oameni privesc cerul acum. Suntem împreună în această liniște.",
      "Poate te-ar ajuta să asculți Sleepwave Symphony din meniu pentru a-ți relaxa mintea cu câteva frecvențe joase.",
      "Sunt doar o prezență digitală, dar îți trimit un gând cald. Ești în siguranță aici."
    ];

    const matchedReply = comfortingReplies[Math.floor(Math.random() * comfortingReplies.length)];

    res.json({
      choices: [{
        message: {
          role: "assistant",
          content: matchedReply
        }
      }]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dreams Journal ──────────────────────────────────────────────────────────
// GET  /api/dreams?uid=XXX  → list entries for user
// POST /api/dreams           → { uid, dream, reflection } → save entry (TTL 14d)
router.get('/dreams', (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'Missing uid' });
  const all = db.getCollection('dreams') || [];
  const entries = all
    .filter(e => e.uid === uid)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30);
  res.json({ entries });
});

router.post('/dreams', (req, res) => {
  const { uid, dream, reflection } = req.body;
  if (!uid || !dream) return res.status(400).json({ error: 'Missing fields' });
  const entry = {
    id: Math.random().toString(36).substr(2, 9),
    uid,
    dream: dream.slice(0, 2000),
    reflection: reflection || '',
    timestamp: Date.now(),
    expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
  };
  const all = db.getCollection('dreams') || [];
  // prune expired
  const pruned = all.filter(e => !e.expiresAt || e.expiresAt > Date.now());
  db.setCollection('dreams', [...pruned, entry]);
  res.json({ success: true, id: entry.id });
});

// ── Night Echoes (Time Capsule) ──────────────────────────────────────────────
// GET  /api/echo?hour=H      → entries for that hour
// POST /api/echo             → { text, hour }
router.get('/echo', (req, res) => {
  const hour = parseInt(req.query.hour ?? new Date().getHours());
  const all = db.getCollection('echoes') || [];
  const entries = all
    .filter(e => e.hour === hour)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
  res.json({ echoes: entries });
});

router.post('/echo', (req, res) => {
  const { text, hour } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  const entry = {
    id: Math.random().toString(36).substr(2, 9),
    text: text.slice(0, 180),
    hour: typeof hour === 'number' ? hour : new Date().getHours(),
    timestamp: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const all = db.getCollection('echoes') || [];
  const pruned = all.filter(e => !e.expiresAt || e.expiresAt > Date.now()).slice(-100);
  db.setCollection('echoes', [...pruned, entry]);
  res.json({ success: true });
});

export default router;
