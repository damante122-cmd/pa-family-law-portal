const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: Object });
}

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/motions', (req, res) => {
  const query = req.query.q ? `%${req.query.q}%` : '%';
  db.all(
    "SELECT * FROM motions WHERE title LIKE ? OR statute LIKE ? OR description LIKE ?",
    [query, query, query],
    (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    }
  );
});

app.post('/api/scan', upload.single('document'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  fs.readFile(req.file.path, 'utf8', (err, textData) => {
    if (fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    const content = (textData || "").toLowerCase();

    db.all("SELECT * FROM motions", [], (err, motions) => {
      if (err) return res.status(500).json({ error: err.message });

      const matches = [];
      motions.forEach(motion => {
        const triggerList = motion.triggers ? motion.triggers.split(',') : [];
        const foundTriggers = triggerList.filter(t => content.includes(t.trim()));
        if (foundTriggers.length > 0) {
          matches.push({
            motion: motion.title,
            statute: motion.statute,
            category: motion.category,
            description: motion.description,
            detectedKeywords: foundTriggers
          });
        }
      });

      res.json({ analyzedLength: content.length, suggestedMotions: matches });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
