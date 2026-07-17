import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');

const INITIAL_DB = {
  users: {},                  // uid -> { settings }
  checkins: [],               // list of { id, uid, text, state, rating, timestamp }
  social_feed: [],            // list of { id, text, timestamp, alias, reactions: { support: 0, listened: 0, hug: 0 }, comments: [] }
  buddy4study_posts: [],      // list of { id, title, category, description, fileName, fileData, timestamp, alias, comments: [] }
  night_echoes: [],           // list of { id, text, hour, timestamp }
  medication_logs: {}         // uid -> [{ id, name, time, taken }]
};

class LocalDB {
  constructor() {
    this.data = { ...INITIAL_DB };
    this.lock = false;
    this.initPromise = this.init();
  }

  async init() {
    try {
      const content = await fs.readFile(DB_FILE, 'utf-8');
      this.data = JSON.parse(content);
      // Clean up keys just in case
      for (const key of Object.keys(INITIAL_DB)) {
        if (!this.data[key]) {
          this.data[key] = INITIAL_DB[key];
        }
      }
    } catch (err) {
      // File doesn't exist, create it
      await this.save();
    }
    // Start periodic TTL sweeper
    setInterval(() => this.pruneOldData(), 60 * 1000); // every minute
  }

  async save() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error saving database:", err);
    }
  }

  // Auto-pruning for Checkins (7 days) and Echoes (24hrs / older than 1 day)
  async pruneOldData() {
    await this.initPromise;
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let modified = false;

    // Checkins prune (older than 7 days)
    const initialCheckinLength = this.data.checkins.length;
    this.data.checkins = this.data.checkins.filter(c => {
      const match = now - c.timestamp < SEVEN_DAYS;
      return match;
    });
    if (this.data.checkins.length !== initialCheckinLength) {
      modified = true;
    }

    // Keep only last 100 echoes
    if (this.data.night_echoes.length > 100) {
      this.data.night_echoes = this.data.night_echoes.slice(-100);
      modified = true;
    }

    if (modified) {
      await this.save();
      console.log(`[DB] Automatically swept expired data at ${new Date().toISOString()}`);
    }
  }

  // --- Collection functions ---

  // Users
  async getUser(uid) {
    await this.initPromise;
    return this.data.users[uid] || null;
  }

  async saveUser(uid, userData) {
    await this.initPromise;
    this.data.users[uid] = { ...this.data.users[uid], ...userData };
    await this.save();
    return this.data.users[uid];
  }

  // Checkins
  async getCheckins(uid) {
    await this.initPromise;
    return this.data.checkins.filter(c => c.uid === uid).sort((a, b) => b.timestamp - a.timestamp);
  }

  async addCheckin(uid, entry) {
    await this.initPromise;
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      uid,
      text: entry.text || '',
      state: entry.state || 'Calm',
      rating: entry.rating || 3,
      timestamp: Date.now()
    };
    this.data.checkins.push(newEntry);
    await this.save();
    return newEntry;
  }

  // Social feed
  async getFeed() {
    await this.initPromise;
    return [...this.data.social_feed].sort((a, b) => b.timestamp - a.timestamp);
  }

  async addFeedPost(post) {
    await this.initPromise;
    const newPost = {
      id: Math.random().toString(36).substr(2, 9),
      text: post.text,
      timestamp: Date.now(),
      alias: post.alias,
      reactions: { support: 0, listened: 0, hug: 0 },
      comments: []
    };
    this.data.social_feed.push(newPost);
    await this.save();
    return newPost;
  }

  async reactToFeedPost(postId, reactionType) {
    await this.initPromise;
    const post = this.data.social_feed.find(p => p.id === postId);
    if (post) {
      if (post.reactions[reactionType] !== undefined) {
        post.reactions[reactionType]++;
        await this.save();
      }
      return post;
    }
    return null;
  }

  async addCommentToFeedPost(postId, comment) {
    await this.initPromise;
    const post = this.data.social_feed.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        id: Math.random().toString(36).substr(2, 9),
        text: comment.text,
        alias: comment.alias,
        timestamp: Date.now()
      });
      await this.save();
      return post;
    }
    return null;
  }

  // Buddy4Study
  async getStudyPosts() {
    await this.initPromise;
    return [...this.data.buddy4study_posts].sort((a, b) => b.timestamp - a.timestamp);
  }

  async addStudyPost(post) {
    await this.initPromise;
    const newPost = {
      id: Math.random().toString(36).substr(2, 9),
      title: post.title,
      category: post.category || 'General',
      description: post.description,
      fileName: post.fileName || null,
      fileData: post.fileData || null, // Base64 document payload
      timestamp: Date.now(),
      alias: post.alias,
      comments: []
    };
    this.data.buddy4study_posts.push(newPost);
    await this.save();
    return newPost;
  }

  async addCommentToStudyPost(postId, comment) {
    await this.initPromise;
    const post = this.data.buddy4study_posts.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        id: Math.random().toString(36).substr(2, 9),
        text: comment.text,
        alias: comment.alias,
        timestamp: Date.now()
      });
      await this.save();
      return post;
    }
    return null;
  }

  // Medication Logs
  async getMedication(uid) {
    await this.initPromise;
    return this.data.medication_logs[uid] || [];
  }

  async saveMedication(uid, meds) {
    await this.initPromise;
    this.data.medication_logs[uid] = meds;
    await this.save();
    return this.data.medication_logs[uid];
  }

  // Night Echoes
  async getEchoes(targetHour) {
    await this.initPromise;
    // Returns echoes matching targetHour, or recent ones
    return this.data.night_echoes
      .filter(e => e.hour === parseInt(targetHour))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async addEcho(echo) {
    await this.initPromise;
    const newEcho = {
      id: Math.random().toString(36).substr(2, 9),
      text: echo.text,
      hour: parseInt(echo.hour),
      timestamp: Date.now()
    };
    this.data.night_echoes.push(newEcho);
    await this.save();
    return newEcho;
  }
}

export const db = new LocalDB();
