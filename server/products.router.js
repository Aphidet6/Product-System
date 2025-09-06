const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { db } = require('./products.db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// configure multer storage
const uploadDir = path.join(__dirname, 'uploads');
// ensure upload directory exists
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { /* ignore */ }
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage });
const { authMiddleware, requireRole } = require('./auth');
const { logAction } = require('./logger');
const { z } = require('zod')

// list + search
router.get('/', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const statusQ = (req.query.status || '').toString().trim();
  const products = (db.data && db.data.products) ? db.data.products : [];
  let filtered = products;
  if (q) {
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.number && p.number.toLowerCase().includes(q))
    );
  }
  if (statusQ) {
    filtered = filtered.filter(p => (p.status || 'Available') === statusQ);
  }
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const products = (db.data && db.data.products) ? db.data.products : [];
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

const createProductSchema = z.object({ name: z.string().min(1), number: z.string().min(1), description: z.optional(z.string()), status: z.optional(z.enum(['Available','Sold out'])), price: z.optional(z.preprocess(v => v === '' ? undefined : Number(v), z.number().nonnegative())) })

router.post('/', authMiddleware, requireRole('Admin'), upload.single('image'), async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: 'invalid body', details: parsed.error.format() })
  const { name, number, description, status, price } = parsed.data
  // enforce unique product number (case-insensitive)
  const products = (db.data && db.data.products) ? db.data.products : [];
  const numberNorm = number.toString().trim().toLowerCase();
  if (products.some(p => (p.number || '').toString().trim().toLowerCase() === numberNorm)) {
    return res.status(409).json({ error: 'product number must be unique' });
  }
  let imageUrl = '';
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (req.body.image) {
    imageUrl = req.body.image;
  }
  const newP = { id: nanoid(), name, number, description: description || '', image: imageUrl, status: status || 'Available', price: price === undefined ? null : Number(price) };
  db.data = db.data || { products: [] };
  db.data.products.push(newP);
  await db.write();
  // log admin create
  try {
    const user = req.user && req.user.username ? req.user.username : 'unknown'
    const ip = req.ip || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || 'unknown'
  const msg = { user, ip, id: newP.id, name: newP.name, number: newP.number, price: newP.price }
  console.log(`[${new Date().toISOString()}] ADMIN CREATE by ${user} (${ip}) - id=${newP.id} name="${newP.name}" number="${newP.number}" price=${newP.price}`)
  logAction('ADMIN_CREATE', msg)
  } catch (e) {}
  res.status(201).json(newP);
});

const updateProductSchema = z.object({ name: z.optional(z.string().min(1)), number: z.optional(z.string().min(1)), description: z.optional(z.string()), status: z.optional(z.enum(['Available','Sold out'])), price: z.optional(z.preprocess(v => v === '' ? undefined : Number(v), z.number().nonnegative())) })

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: 'invalid body', details: parsed.error.format() })
  req.body = parsed.data
  db.data = db.data || { products: [] };
  const idx = db.data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  // allow Admin to update everything; allow User to update only `status`
  const role = req.user && req.user.role ? req.user.role : null;
  if (role !== 'Admin' && role !== 'User') return res.status(403).json({ error: 'forbidden' });

  if (role === 'User') {
    // Users may only update the status field
    const allowed = {};
    if (req.body && typeof req.body.status === 'string') {
      allowed.status = req.body.status
    }
    if (Object.keys(allowed).length === 0) return res.status(400).json({ error: 'nothing to update' });
    const updated = { ...db.data.products[idx], ...allowed };
    db.data.products[idx] = updated;
    await db.write();
    // log user status change
    try {
      const user = req.user && req.user.username ? req.user.username : 'unknown'
      const ip = req.ip || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || 'unknown'
    const msg = { user, ip, id: updated.id, number: updated.number, status: updated.status }
    console.log(`[${new Date().toISOString()}] USER STATUS_CHANGE by ${user} (${ip}) - id=${updated.id} number="${updated.number}" status="${updated.status}"`)
    logAction('USER_STATUS_CHANGE', msg)
    } catch (e) {}
    return res.json(db.data.products[idx]);
  }

  // role === 'Admin' -> full update
  // enforce unique product number (case-insensitive), exclude current product
  const { number } = req.body;
  if (number) {
    const numberNorm = number.toString().trim().toLowerCase();
    const conflict = db.data.products.find(p => p.id !== req.params.id && (p.number || '').toString().trim().toLowerCase() === numberNorm);
    if (conflict) return res.status(409).json({ error: 'product number must be unique' });
  }
  // capture original before applying changes
  const before = Object.assign({}, db.data.products[idx])
  const updated = { ...before, ...req.body };
  if (req.body.price !== undefined) {
    updated.price = req.body.price !== '' ? Number(req.body.price) : null
  }
  if (req.file) {
    updated.image = `/uploads/${req.file.filename}`;
  }
  db.data.products[idx] = updated;
  await db.write();
  // log admin update with changed fields (include before/after values)
  try {
    const user = req.user && req.user.username ? req.user.username : 'unknown'
    const ip = req.ip || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || 'unknown'
    const changed = []
    const keys = new Set([...(Object.keys(req.body || {})), ...(req.file ? ['image'] : [])])
    keys.forEach(k => {
      const b = before[k] === undefined ? null : before[k]
      const a = updated[k] === undefined ? null : updated[k]
      // compare stringified values to catch type changes
      if (String(b) !== String(a)) changed.push({ field: k, before: b, after: a })
    })
    const msg = { user, ip, id: updated.id, number: updated.number, changed }
    console.log(`[${new Date().toISOString()}] ADMIN UPDATE by ${user} (${ip}) - id=${updated.id} number="${updated.number}" changed=${JSON.stringify(changed)}`)
    logAction('ADMIN_UPDATE', msg)
  } catch (e) {}
  res.json(db.data.products[idx]);
});

router.delete('/:id', authMiddleware, requireRole('Admin'), async (req, res) => {
  db.data = db.data || { products: [] };
  const toDelete = db.data.products.find(p => p.id === req.params.id)
  db.data.products = db.data.products.filter(p => p.id !== req.params.id);
  await db.write();
  // log admin delete
  try {
    const user = req.user && req.user.username ? req.user.username : 'unknown'
    const ip = req.ip || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || 'unknown'
    if (toDelete) {
      const msg = { user, ip, id: toDelete.id, number: toDelete.number, name: toDelete.name }
      console.log(`[${new Date().toISOString()}] ADMIN DELETE by ${user} (${ip}) - id=${toDelete.id} number="${toDelete.number}" name="${toDelete.name}"`)
      logAction('ADMIN_DELETE', msg)
    } else {
      const msg = { user, ip, id: req.params.id, notFound: true }
      console.log(`[${new Date().toISOString()}] ADMIN DELETE by ${user} (${ip}) - id=${req.params.id} (not found)`)
      logAction('ADMIN_DELETE', msg)
    }
  } catch (e) {}
  res.status(204).end();
});

module.exports = router;
