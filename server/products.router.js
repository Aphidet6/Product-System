const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { db } = require('./products.db');
const multer = require('multer');
const path = require('path');

// configure multer storage
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage });

// list + search
router.get('/', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const products = (db.data && db.data.products) ? db.data.products : [];
  if (!q) return res.json(products);
  const filtered = products.filter(p =>
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.number && p.number.toLowerCase().includes(q))
  );
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const products = (db.data && db.data.products) ? db.data.products : [];
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

router.post('/', upload.single('image'), async (req, res) => {
  const { name, number, description } = req.body;
  if (!name || !number) return res.status(400).json({ error: 'name and number required' });
  let imageUrl = '';
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (req.body.image) {
    imageUrl = req.body.image;
  }
  const newP = { id: nanoid(), name, number, description: description || '', image: imageUrl };
  db.data = db.data || { products: [] };
  db.data.products.push(newP);
  await db.write();
  res.status(201).json(newP);
});

router.put('/:id', upload.single('image'), async (req, res) => {
  db.data = db.data || { products: [] };
  const idx = db.data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const updated = { ...db.data.products[idx], ...req.body };
  if (req.file) {
    updated.image = `/uploads/${req.file.filename}`;
  }
  db.data.products[idx] = updated;
  await db.write();
  res.json(db.data.products[idx]);
});

router.delete('/:id', async (req, res) => {
  db.data = db.data || { products: [] };
  db.data.products = db.data.products.filter(p => p.id !== req.params.id);
  await db.write();
  res.status(204).end();
});

module.exports = router;
