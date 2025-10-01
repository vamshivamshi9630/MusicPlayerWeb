require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(morgan('tiny'));

// Config from .env
const SONGS_JSON_REMOTE = process.env.SONGS_JSON_REMOTE ||
  "https://raw.githubusercontent.com/vamshivamshi9630/MusicData/main/songs.json";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";

// Authentication (optional)
function requireAuth(req, res, next) {
  if (!AUTH_TOKEN) return next();
  const key = req.get("x-api-key") || req.query.key;
  if (key === AUTH_TOKEN) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// Songs list
app.get("/api/songs", requireAuth, async (req, res) => {
  try {
    const r = await fetch(SONGS_JSON_REMOTE);
    if (!r.ok) return res.status(502).json({ error: "Failed fetching songs.json" });
    const songs = await r.json();

    // Rewrite URLs so raw GitHub links are hidden
    const rewritten = songs.map(s => ({
      ...s,
      url: `/media?url=${encodeURIComponent(s.url)}`,
      albumImageUrl: s.albumImageUrl
        ? `/media?url=${encodeURIComponent(s.albumImageUrl)}`
        : null,
    }));

    res.json(rewritten);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Media proxy (hides GitHub links)
app.get("/media", requireAuth, async (req, res) => {
  const remote = req.query.url;
  if (!remote) return res.status(400).send("Missing url");

  try {
    const headers = {};
    if (req.get("range")) headers.Range = req.get("range"); // stream support

    const r = await fetch(remote, { headers });
    if (!r.ok) return res.status(502).send("Upstream fetch failed");

    res.status(r.status);
    r.headers.forEach((v, k) => res.setHeader(k, v));
    r.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// Serve frontend
app.use(express.static("public"));

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
