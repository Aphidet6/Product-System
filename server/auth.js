const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const usersFile = path.join(__dirname, 'users.json');
const SECRET = 'dev-secret-change-me';
const { logAction } = require('./logger')

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(usersFile, 'utf8')) } catch (e) { return [] }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const users = loadUsers()
  const u = users.find(x => x.username === username && x.password === password)
  if (!u) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || ''
      const userAgent = req.get('user-agent') || ''
      logAction('LOGIN_FAILURE', { username: username || null, ip, userAgent, reason: 'invalid credentials' })
  } catch (e) { }
  // also print to server terminal for quick visibility
  try { console.log(`[LOGIN_FAILURE] ${new Date().toISOString()} username=${username || '-'} ip=${req.ip || ''}`) } catch (e) {}
  return res.status(401).json({ error: 'invalid credentials' })
  }
  
  // log successful login (avoid logging passwords)
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || ''
    const userAgent = req.get('user-agent') || ''
    logAction('LOGIN_SUCCESS', { username: u.username, role: u.role, ip, userAgent })
  } catch (e) { /* ignore logging errors */ }
  try { console.log(`[LOGIN_SUCCESS] ${new Date().toISOString()} username=${u.username} role=${u.role} ip=${req.ip || ''}`) } catch (e) {}

  const token = jwt.sign({ username: u.username, role: u.role }, SECRET, { expiresIn: '8h' })
  res.json({ token, role: u.role })
})

// logout endpoint for audit (does not revoke JWT by itself)
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const user = req.user || {}
    const ip = req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || ''
    const userAgent = req.get('user-agent') || ''
    logAction('LOGOUT', { username: user.username, role: user.role, ip, userAgent })
  } catch (e) { /* ignore */ }
  try { console.log(`[LOGOUT] ${new Date().toISOString()} username=${req.user && req.user.username ? req.user.username : '-'} role=${req.user && req.user.role ? req.user.role : '-'} ip=${req.ip || ''}`) } catch (e) {}
  res.json({ ok: true })
})

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.slice(7)
  try {
    const data = jwt.verify(token, SECRET)
    req.user = data
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'missing token' })
    if (req.user.role !== role) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}

module.exports = { router, authMiddleware, requireRole, SECRET };
